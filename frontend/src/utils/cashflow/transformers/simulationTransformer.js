// src/utils/cashflow/transformers/simulationTransformer.js - Updated to new methodology

/**
 * Extract percentile data from simulation results
 * @param {Object} data - Object containing simulation data and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @param {Object} context - Context object containing percentile information
 * @returns {Array} Array of DataPointSchema objects
 */
export const extractPercentileData = (data, sourceConfig, context) => {
    const { projectLife, numWTGs, currency } = data;

    // More robust validation
    if (!data) {
        console.warn('extractPercentileData: No simulation data provided');
        return [];
    }

    if (!context || !context.percentile) {
        console.warn('extractPercentileData: No percentile specified in context');
        return [];
    }

    // Find simulation results in the data object
    let simulationData = null;

    // Look for simulation data in the values
    Object.values(data).forEach(value => {
        if (value && value.results && Array.isArray(value.results)) {
            simulationData = value;
        }
    });

    // Handle different possible simulation data structures
    let results = null;

    if (simulationData && simulationData.results) {
        results = simulationData.results;
    } else if (Array.isArray(simulationData)) {
        results = simulationData;
    } else {
        console.warn('extractPercentileData: Simulation data has no recognizable results structure:', Object.keys(data));
        return [];
    }

    if (!Array.isArray(results)) {
        console.warn('extractPercentileData: Results is not an array:', typeof results);
        return [];
    }

    // Find the percentile result
    const percentileResult = results.find(result => {
        // Handle different possible percentile structures
        if (result.percentile) {
            if (typeof result.percentile === 'number') {
                return result.percentile === context.percentile;
            }
            if (result.percentile.value) {
                return result.percentile.value === context.percentile;
            }
        }
        // Also check if result itself has a value property that matches
        if (result.value === context.percentile) {
            return true;
        }
        return false;
    });

    if (!percentileResult) {
        console.warn(`extractPercentileData: Percentile ${context.percentile} not found in results. Available:`,
            results.map(r => r.percentile?.value || r.percentile || 'unknown')
        );
        return [];
    }

    const extractedData = percentileResult.data || [];

    console.log(`📊 Extracted P${context.percentile} data: ${extractedData.length} points for ${sourceConfig.id}`);

    return extractedData;
};

/**
 * Extract fixed data from configuration sources
 * @param {Object} data - Object containing source data and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const extractFixedData = (data, sourceConfig) => {
    const { projectLife, numWTGs, currency } = data;

    if (!data) {
        console.warn('extractFixedData: No source data provided');
        return [];
    }

    // Find the actual source data (exclude global data)
    const globalKeys = ['projectLife', 'numWTGs', 'currency'];
    const sourceDataEntries = Object.entries(data).filter(([key]) => !globalKeys.includes(key));

    if (sourceDataEntries.length === 0) {
        console.warn('extractFixedData: No source data found after filtering global data');
        return [];
    }

    // Get the first non-global data entry
    const [dataKey, sourceData] = sourceDataEntries[0];

    // If data is already in correct format (array of {year, value})
    if (Array.isArray(sourceData)) {
        const validData = sourceData.filter(item =>
            item &&
            typeof item.year === 'number' &&
            typeof item.value === 'number'
        );

        console.log(`📋 Extracted fixed array data: ${validData.length} points for ${sourceConfig.id}`);
        return validData;
    }

    // Handle single value (convert to time series)
    if (typeof sourceData === 'number') {
        const timeSeries = [];
        for (let year = 1; year <= projectLife; year++) {
            timeSeries.push({ year, value: sourceData });
        }

        console.log(`📋 Converted single value to time series: ${timeSeries.length} points for ${sourceConfig.id}`);
        return timeSeries;
    }

    // Handle object data (like contracts, events, etc.)
    if (typeof sourceData === 'object' && sourceData !== null) {
        console.log(`📋 Object data passed through for transformer: ${sourceConfig.id}`);
        // Let the specific transformer handle object data
        return sourceData;
    }

    console.warn('extractFixedData: Unsupported data format for:', sourceConfig.id, typeof sourceData);
    return [];
};