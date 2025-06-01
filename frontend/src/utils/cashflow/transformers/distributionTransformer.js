// src/utils/cashflow/transformers/distributionTransformer.js - Fixed distribution transformations

/**
 * Transform distribution parameters to time series data
 * @param {Object} distributionData - Distribution configuration object
 * @param {Object} sourceConfig - Source configuration
 * @param {Object} context - Transformation context {projectLife, etc.}
 * @returns {Array} Array of DataPointSchema objects
 */
export const distributionToTimeSeries = (distributionData, sourceConfig, context = {}) => {
    if (!distributionData || typeof distributionData !== 'object') {
        console.warn('distributionToTimeSeries: Invalid distribution data');
        return [];
    }

    // Check if this is actually simulation results data (wrong transformer used)
    if (distributionData.results || Array.isArray(distributionData)) {
        console.warn('distributionToTimeSeries: Received simulation results, not distribution config. Use extractPercentileData instead.');
        return [];
    }

    const { projectLife = 20 } = context;

    // Validate distribution structure
    if (!distributionData.parameters && !distributionData.timeSeriesParameters) {
        console.warn('distributionToTimeSeries: No parameters found in distribution data');
        return [];
    }

    const { parameters = {}, timeSeriesParameters = {}, type, timeSeriesMode } = distributionData;
    const timeSeries = [];

    try {
        // Handle time series mode (if enabled and data available)
        if (timeSeriesMode && timeSeriesParameters.value && Array.isArray(timeSeriesParameters.value)) {
            console.log('Using time series parameters for distribution');
            return timeSeriesParameters.value
                .filter(item => item && typeof item.year === 'number' && typeof item.value === 'number')
                .sort((a, b) => a.year - b.year);
        }

        // Handle different distribution types for static parameters
        let baseValue = 0;

        switch (type) {
            case 'fixed':
                baseValue = parameters.value || 0;
                break;

            case 'normal':
                // For normal distribution, use mean (or value if mean not available)
                baseValue = parameters.mean || parameters.value || 0;
                break;

            case 'lognormal':
                // For lognormal, use value parameter
                baseValue = parameters.value || 0;
                break;

            case 'triangular':
                // For triangular, use mode or calculate average
                baseValue = parameters.mode ||
                    ((parameters.min || 0) + (parameters.max || 0) + (parameters.value || 0)) / 3;
                break;

            case 'uniform':
                // For uniform, use average of min and max
                baseValue = ((parameters.min || 0) + (parameters.max || 0)) / 2;
                break;

            case 'weibull':
                // For weibull, use scale parameter or value
                baseValue = parameters.scale || parameters.value || 0;
                break;

            case 'exponential':
                // For exponential, use lambda reciprocal or value
                baseValue = parameters.lambda ? (1 / parameters.lambda) : (parameters.value || 0);
                break;

            case 'gbm':
                // For Geometric Brownian Motion, use initial value
                baseValue = parameters.value || 0;
                break;

            default:
                // Fallback: try to find any numeric parameter
                baseValue = parameters.value || parameters.mean || parameters.scale || parameters.mode || 0;
                console.warn(`distributionToTimeSeries: Unknown distribution type '${type}', using fallback value`);
        }

        // Generate time series for the project life
        for (let year = 1; year <= projectLife; year++) {
            timeSeries.push({ year, value: baseValue });
        }

        console.log(`distributionToTimeSeries: Generated ${timeSeries.length} data points for ${type} distribution with base value ${baseValue}`);

    } catch (error) {
        console.error('distributionToTimeSeries: Error processing distribution:', error);
        return [];
    }

    return timeSeries;
};

/**
 * Extract base value from distribution for display purposes
 * @param {Object} distributionData - Distribution configuration object
 * @returns {number} Base value from distribution
 */
export const getDistributionBaseValue = (distributionData) => {
    if (!distributionData || !distributionData.parameters) {
        return 0;
    }

    const { parameters, type } = distributionData;

    switch (type) {
        case 'fixed':
            return parameters.value || 0;
        case 'normal':
            return parameters.mean || parameters.value || 0;
        case 'lognormal':
            return parameters.value || 0;
        case 'triangular':
            return parameters.mode || ((parameters.min || 0) + (parameters.max || 0) + (parameters.value || 0)) / 3;
        case 'uniform':
            return ((parameters.min || 0) + (parameters.max || 0)) / 2;
        case 'weibull':
            return parameters.scale || parameters.value || 0;
        case 'exponential':
            return parameters.lambda ? (1 / parameters.lambda) : (parameters.value || 0);
        case 'gbm':
            return parameters.value || 0;
        default:
            return parameters.value || parameters.mean || parameters.scale || parameters.mode || 0;
    }
};