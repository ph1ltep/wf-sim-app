// frontend/src/utils/cashflow/metrics/processor.js
import { CASHFLOW_METRICS_REGISTRY, getMetricConfig } from './registry.js';

/**
 * Aggregation strategies for time-series data
 */
const AGGREGATION_METHODS = {
    sum: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        return filtered.reduce((sum, point) => sum + point.value, 0);
    },

    npv: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        const discountRate = options.discountRate === 'auto' ? 0.08 : options.discountRate;

        if (discountRate === 'irr_solve') {
            // Special case for IRR calculation - return data for IRR solver
            return filtered;
        }

        return filtered.reduce((npv, point) => {
            const presentValue = point.value / Math.pow(1 + discountRate, point.year);
            return npv + presentValue;
        }, 0);
    },

    mean: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        if (filtered.length === 0) return 0;
        const sum = filtered.reduce((sum, point) => sum + point.value, 0);
        return sum / filtered.length;
    },

    min: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        if (filtered.length === 0) return 0;
        return Math.min(...filtered.map(point => point.value));
    },

    max: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        if (filtered.length === 0) return 0;
        return Math.max(...filtered.map(point => point.value));
    },

    first: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        return filtered; // Return full time series for display
    },

    last: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        if (filtered.length === 0) return 0;
        return filtered[filtered.length - 1].value;
    },

    weighted_mean: (data, options = {}) => {
        const filtered = filterTimeSeries(data, options.filter);
        const { weights = [] } = options;

        if (weights.length !== filtered.length) {
            console.warn('Weighted mean: weights length mismatch, using simple mean');
            return AGGREGATION_METHODS.mean(data, options);
        }

        const weightedSum = filtered.reduce((sum, point, index) => {
            return sum + (point.value * weights[index]);
        }, 0);

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
};

/**
 * Filter time series data based on operational periods
 */
const filterTimeSeries = (data, filter = 'all') => {
    if (!Array.isArray(data)) return [];

    switch (filter) {
        case 'operational':
            return data.filter(point => point.year > 0);

        case 'construction':
            return data.filter(point => point.year <= 0);

        case 'early':
            return data.filter(point => point.year <= 10);

        case 'late':
            return data.filter(point => point.year > 10);

        case 'all':
        default:
            return data;
    }
};

/**
 * Apply aggregation strategy to time-series data
 * @param {Array} data - Time series data [{year, value}, ...]
 * @param {Object} aggregation - Aggregation configuration
 * @returns {*} Aggregated result
 */
export const applyAggregationStrategy = (data, aggregation) => {
    const { method, options = {} } = aggregation;

    if (!AGGREGATION_METHODS[method]) {
        console.warn(`Unknown aggregation method: ${method}, using sum`);
        return AGGREGATION_METHODS.sum(data, options);
    }

    return AGGREGATION_METHODS[method](data, options);
};

/**
 * Extract data from CashflowDataSource based on dependency keys
 * @param {Object} cashflowData - CashflowDataSource object
 * @param {Array} dependsOn - Array of dependency keys
 * @returns {Object} Extracted data by dependency key
 */
export const extractDependencyData = (cashflowData, dependsOn) => {
    const extracted = {};

    dependsOn.forEach(key => {
        // Check aggregations first
        if (cashflowData.aggregations?.[key]) {
            extracted[key] = cashflowData.aggregations[key].data;
        }
        // Check financeMetrics
        else if (cashflowData.financeMetrics?.[key]) {
            const metric = cashflowData.financeMetrics[key];
            extracted[key] = metric.data || metric.value;
        }
        // Check lineItems by category mapping
        else {
            const lineItem = findLineItemByKey(cashflowData.lineItems, key);
            if (lineItem) {
                extracted[key] = lineItem.data;
            } else {
                console.warn(`Dependency data not found: ${key}`);
                extracted[key] = null;
            }
        }
    });

    return extracted;
};

/**
 * Find line item by key using category mapping
 */
const findLineItemByKey = (lineItems, key) => {
    // Simple key mapping for common dependencies
    const keyMappings = {
        energyProduction: 'energyRevenue',
        equityInvestment: 'capexDrawdown',
        debtService: 'debtDrawdown',
        interestPayments: 'debtInterest',
        outstandingDebt: 'debtBalance'
    };

    const mappedKey = keyMappings[key] || key;
    return lineItems?.find(item => item.id === mappedKey);
};

/**
 * Calculate single metric from registry
 * @param {string} metricKey - Metric key from registry
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateMetricFromRegistry = (metricKey, input) => {
    const config = getMetricConfig(metricKey);

    if (!config) {
        return {
            value: null,
            error: `Unknown metric: ${metricKey}`,
            metadata: {
                calculationMethod: metricKey,
                aggregationMethod: null,
                inputSources: []
            }
        };
    }

    try {
        const startTime = performance.now();

        // Extract dependency data
        const dependencyData = extractDependencyData(
            input.cashflowData,
            config.cubeConfig.dependsOn
        );

        // Calculate metric
        const result = config.calculate({
            ...input,
            aggregations: dependencyData
        });

        const endTime = performance.now();

        return {
            value: result.value,
            error: result.error || null,
            metadata: {
                calculationMethod: metricKey,
                aggregationMethod: config.cubeConfig.aggregation.method,
                inputSources: config.cubeConfig.dependsOn,
                computationTime: endTime - startTime,
                ...result.metadata
            }
        };
    } catch (error) {
        console.warn(`Metric calculation failed for ${metricKey}:`, error.message);
        return {
            value: null,
            error: error.message,
            metadata: {
                calculationMethod: metricKey,
                aggregationMethod: config.cubeConfig.aggregation.method,
                inputSources: config.cubeConfig.dependsOn
            }
        };
    }
};

/**
 * Compute all metrics for CashflowContext
 * @param {Object} cashflowData - CashflowDataSource object
 * @param {Object} scenarioData - Scenario data for parameters
 * @param {Object} options - Computation options
 * @returns {Map} Map of metric key -> MetricResult
 */
export const computeAllMetrics = (cashflowData, scenarioData, options = {}) => {
    const results = new Map();
    const input = { cashflowData, scenarioData, options };

    // Sort metrics by priority for dependency resolution
    const sortedMetrics = Object.entries(CASHFLOW_METRICS_REGISTRY)
        .sort(([, a], [, b]) => a.priority - b.priority);

    sortedMetrics.forEach(([metricKey, config]) => {
        try {
            const result = calculateMetricFromRegistry(metricKey, input);
            results.set(metricKey, result);

            // Log successful calculations in development
            if (process.env.NODE_ENV === 'development' && result.value !== null) {
                console.log(`✅ Computed ${metricKey}:`,
                    typeof result.value === 'number' ? result.value.toFixed(2) : result.value
                );
            }
        } catch (error) {
            console.warn(`Failed to compute metric ${metricKey}:`, error.message);
            results.set(metricKey, {
                value: null,
                error: error.message,
                metadata: { calculationMethod: metricKey }
            });
        }
    });

    return results;
};

/**
 * Get aggregation strategy for backward compatibility
 * @param {string} metricKey - Metric key
 * @returns {Object|null} Aggregation strategy
 */
export const getAggregationStrategy = (metricKey) => {
    const config = getMetricConfig(metricKey);
    return config?.cubeConfig?.aggregation || null;
};

/**
 * Migration helper for WIND_INDUSTRY_AGGREGATIONS compatibility
 * @param {string} oldMetricKey - Old metric key
 * @returns {Object|null} Aggregation strategy
 */
export const migrateFromWindIndustryAggregations = (oldMetricKey) => {
    const strategy = getAggregationStrategy(oldMetricKey);
    if (!strategy) {
        console.warn(`No registry strategy found for metric: ${oldMetricKey}`);
        return null;
    }
    return strategy;
};