// frontend/src/utils/timeSeries/aggregation.js
// Time-series aggregation utility for wind industry metrics

/**
 * Aggregate time-series data using various methods
 * @param {Array} data - Time-series data array with {year, value} structure
 * @param {string} method - Aggregation method: 'mean', 'min', 'max', 'sum', 'npv', 'first', 'last'
 * @param {Object} options - Aggregation options
 * @param {string} options.filter - Filter: 'all', 'operational', 'construction', 'early', 'late'
 * @param {number} options.discountRate - Discount rate for NPV calculations (default: 0)
 * @param {number} options.precision - Decimal places (default: 2)
 * @param {Array} options.weights - Custom weights array for weighted mean
 * @returns {number|null} Aggregated value
 */
export const aggregateTimeSeries = (data, method, options = {}) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const {
        filter = 'all',
        discountRate = 0,
        precision = 2,
        weights = null
    } = options;

    // Apply period filters
    let filteredData = data;
    switch (filter) {
        case 'operational':
            filteredData = data.filter(d => d.year > 0);
            break;
        case 'construction':
            filteredData = data.filter(d => d.year <= 0);
            break;
        case 'early':
            filteredData = data.filter(d => d.year > 0 && d.year <= 5);
            break;
        case 'late':
            filteredData = data.filter(d => d.year > 15);
            break;
    }

    const values = filteredData.map(d => d.value).filter(v => typeof v === 'number');
    if (values.length === 0) return null;

    let result;
    switch (method) {
        case 'mean':
            if (weights && weights.length === values.length) {
                const weightedSum = values.reduce((sum, val, i) => sum + (val * weights[i]), 0);
                const weightSum = weights.reduce((sum, w) => sum + w, 0);
                result = weightSum > 0 ? weightedSum / weightSum : 0;
            } else {
                result = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
            break;
        case 'min':
            result = Math.min(...values);
            break;
        case 'max':
            result = Math.max(...values);
            break;
        case 'sum':
            result = values.reduce((sum, val) => sum + val, 0);
            break;
        case 'npv':
            result = filteredData.reduce((npv, d) => {
                const discountFactor = Math.pow(1 + discountRate, -d.year);
                return npv + (d.value * discountFactor);
            }, 0);
            break;
        case 'first':
            result = values[0];
            break;
        case 'last':
            result = values[values.length - 1];
            break;
        default:
            throw new Error(`Unsupported aggregation method: ${method}`);
    }

    return precision > 0 ? Number(result.toFixed(precision)) : result;
};

/**
 * Wind industry specific aggregation strategies
 */
export const WIND_INDUSTRY_AGGREGATIONS = {
    // Financial metrics
    npv: { method: 'npv', options: { filter: 'all' } },
    irr: { method: 'first', options: { filter: 'all' } },
    equityIRR: { method: 'first', options: { filter: 'all' } },
    paybackPeriod: { method: 'first', options: { filter: 'all' } },
    lcoe: { method: 'first', options: { filter: 'all' } },

    // Coverage ratios - minimums during operations
    minDSCR: { method: 'min', options: { filter: 'operational' } },
    avgDSCR: { method: 'mean', options: { filter: 'operational' } },
    minICR: { method: 'min', options: { filter: 'operational' } },
    avgICR: { method: 'mean', options: { filter: 'operational' } },

    // Loan ratios
    llcr: { method: 'first', options: { filter: 'all' } },

    // Cash flows - operational focus
    totalCashflow: { method: 'sum', options: { filter: 'operational' } },
    totalRevenue: { method: 'sum', options: { filter: 'operational' } },
    totalCosts: { method: 'sum', options: { filter: 'operational' } },

    // Break-even metrics
    breakEvenYear: { method: 'first', options: { filter: 'all' } }
};

/**
 * Apply wind industry aggregation strategy
 * @param {Array} data - Time-series data
 * @param {string} metricKey - Key from WIND_INDUSTRY_AGGREGATIONS
 * @param {Object} customOptions - Override default options
 * @returns {number|null} Aggregated value
 */
export const aggregateForWindIndustry = (data, metricKey, customOptions = {}) => {
    const strategy = WIND_INDUSTRY_AGGREGATIONS[metricKey];
    if (!strategy) {
        console.warn(`Unknown wind industry metric: ${metricKey}`);
        return null;
    }

    const options = { ...strategy.options, ...customOptions };
    return aggregateTimeSeries(data, strategy.method, options);
};

/**
 * Aggregate multiple metrics simultaneously
 * @param {Array} data - Time-series data
 * @param {Array} metricKeys - Array of metric keys to aggregate
 * @param {Object} customOptions - Options to apply to all aggregations
 * @returns {Object} Results keyed by metric
 */
export const aggregateMultipleMetrics = (data, metricKeys, customOptions = {}) => {
    const results = {};

    metricKeys.forEach(metricKey => {
        try {
            results[metricKey] = aggregateForWindIndustry(data, metricKey, customOptions);
        } catch (error) {
            console.error(`Error aggregating metric ${metricKey}:`, error);
            results[metricKey] = null;
        }
    });

    return results;
};

/**
 * Get aggregation method for a given metric
 * @param {string} metricKey - Target metric key
 * @returns {string} Aggregation method
 */
export const getAggregationMethod = (metricKey) => {
    const strategy = WIND_INDUSTRY_AGGREGATIONS[metricKey];
    return strategy ? strategy.method : 'first';
};

/**
 * Get aggregation options for a given metric
 * @param {string} metricKey - Target metric key
 * @returns {Object} Aggregation options
 */
export const getAggregationOptions = (metricKey) => {
    const strategy = WIND_INDUSTRY_AGGREGATIONS[metricKey];
    return strategy ? strategy.options : {};
};