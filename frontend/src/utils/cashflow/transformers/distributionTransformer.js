/**
 * Transform distribution parameters to time series data
 * @param {Object} data - Object with distribution data and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const distributionToTimeSeries = (data, sourceConfig) => {
    // Extract the distribution data (could be under various keys)
    const distributionData = Object.values(data).find(item =>
        item && typeof item === 'object' && (item.parameters || item.timeSeriesParameters)
    );

    const { projectLife } = data;

    if (!distributionData || typeof distributionData !== 'object') {
        console.warn('distributionToTimeSeries: Invalid distribution data');
        return [];
    }

    // Check if this is actually simulation results data (wrong transformer used)
    if (distributionData.results || Array.isArray(distributionData)) {
        console.warn('distributionToTimeSeries: Received simulation results, not distribution config. Use extractPercentileData instead.');
        return [];
    }

    // Validate distribution structure
    if (!distributionData.parameters && !distributionData.timeSeriesParameters) {
        console.warn('distributionToTimeSeries: No parameters found in distribution data');
        return [];
    }

    const { parameters = {}, timeSeriesParameters = {}, type, timeSeriesMode, key } = distributionData;
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
                baseValue = parameters.mean || parameters.value || 0;
                break;
            case 'lognormal':
                baseValue = parameters.value || 0;
                break;
            case 'triangular':
                baseValue = parameters.mode ||
                    ((parameters.min || 0) + (parameters.max || 0) + (parameters.value || 0)) / 3;
                break;
            case 'uniform':
                baseValue = ((parameters.min || 0) + (parameters.max || 0)) / 2;
                break;
            case 'weibull':
                baseValue = parameters.scale || parameters.value || 0;
                break;
            case 'exponential':
                baseValue = parameters.lambda ? (1 / parameters.lambda) : (parameters.value || 0);
                break;
            case 'gbm':
                baseValue = parameters.value || 0;
                break;
            default:
                baseValue = parameters.value || parameters.mean || parameters.scale || parameters.mode || 0;
                console.warn(`distributionToTimeSeries: Unknown distribution type '${type}', using fallback value`);
        }

        // Generate flat time series for the project life
        for (let year = 1; year <= projectLife; year++) {
            timeSeries.push({ year, value: baseValue });
        }

        console.log(`📊 Distribution to timeseries: Generated ${timeSeries.length} data points for ${type} distribution with base value ${baseValue}`);

    } catch (error) {
        console.error('distributionToTimeSeries: Error processing distribution:', error);
        return [];
    }

    return timeSeries;
};