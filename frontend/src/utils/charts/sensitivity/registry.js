// frontend/src/utils/charts/sensitivity/registry.js
// Chart type registry and validation for sensitivity analysis

/**
 * Chart type registry for sensitivity analysis
 */
export const SENSITIVITY_CHART_TYPES = {
    tornado: {
        label: 'Impact Ranking',
        description: 'Single-value impact comparison showing variable importance',
        component: 'TornadoChart',
        dataType: 'aggregated',
        defaultFor: ['npv', 'irr', 'lcoe', 'paybackPeriod', 'equityIRR'],
        icon: 'BarChartOutlined',
        minVariables: 1,
        maxVariables: 20
    },
    heatmap: {
        label: 'Time-Series Analysis',
        description: 'Year-by-year impact visualization for time-dependent metrics',
        component: 'SensitivityHeatmap',
        dataType: 'timeSeries',
        defaultFor: ['dscr', 'icr', 'cashflow'],
        icon: 'HeatMapOutlined',
        minVariables: 2,
        maxVariables: 15
    }
};

/**
 * Get appropriate chart type for a metric
 * @param {string} targetMetric - Target metric key
 * @param {number} variableCount - Number of variables
 * @returns {string} Chart type key
 */
export const getOptimalChartType = (targetMetric, variableCount = 5) => {
    // Find chart type that includes this metric in defaultFor
    for (const [chartType, config] of Object.entries(SENSITIVITY_CHART_TYPES)) {
        if (config.defaultFor.includes(targetMetric) &&
            variableCount >= config.minVariables &&
            variableCount <= config.maxVariables) {
            return chartType;
        }
    }

    // Fallback to tornado for most metrics
    return 'tornado';
};

/**
 * Get chart configuration for a specific chart type
 * @param {string} chartType - Chart type key
 * @returns {Object} Chart configuration
 */
export const getChartConfig = (chartType) => {
    return SENSITIVITY_CHART_TYPES[chartType] || SENSITIVITY_CHART_TYPES.tornado;
};

/**
 * Validate if chart type is suitable for the given data
 * @param {string} chartType - Chart type key
 * @param {number} variableCount - Number of variables
 * @param {string} targetMetric - Target metric
 * @returns {Object} Validation result with isValid and message
 */
export const validateChartConfig = (chartType, variableCount, targetMetric) => {
    const config = getChartConfig(chartType);

    if (variableCount < config.minVariables) {
        return {
            isValid: false,
            message: `${config.label} requires at least ${config.minVariables} variables. Found ${variableCount}.`
        };
    }

    if (variableCount > config.maxVariables) {
        return {
            isValid: false,
            message: `${config.label} supports maximum ${config.maxVariables} variables. Found ${variableCount}. Consider filtering variables.`
        };
    }

    return { isValid: true, message: '' };
};

/**
 * Get available chart types for a metric and variable count
 * @param {string} targetMetric - Target metric key
 * @param {number} variableCount - Number of variables
 * @returns {Array} Array of suitable chart type keys
 */
export const getSuitableChartTypes = (targetMetric, variableCount) => {
    const suitableTypes = [];

    for (const [chartType, config] of Object.entries(SENSITIVITY_CHART_TYPES)) {
        if (variableCount >= config.minVariables && variableCount <= config.maxVariables) {
            suitableTypes.push({
                key: chartType,
                ...config,
                isDefault: config.defaultFor.includes(targetMetric)
            });
        }
    }

    return suitableTypes.sort((a, b) => b.isDefault - a.isDefault);
};