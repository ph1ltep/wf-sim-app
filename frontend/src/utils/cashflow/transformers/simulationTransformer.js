// src/utils/cashflow/transformers/simulationTransformer.js - Updated to new signature

/**
 * Extract percentile data from simulation results
 * @param {Object} dataSource - Primary data: simulation results object
 * @param {Object} dataReferences - Reference data: {reference: {}, global: {projectLife, numWTGs, currency}, context: {percentile, ...}}
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const extractPercentileData = (dataSource, dataReferences, sourceConfig) => {
    const simulationData = dataSource;
    const { projectLife, numWTGs, currency } = dataReferences.global;
    const { percentile } = dataReferences.context;

    // More robust validation
    if (!simulationData) {
        console.warn('extractPercentileData: No simulation data provided');
        return [];
    }

    if (!percentile) {
        console.warn('extractPercentileData: No percentile specified in context');
        return [];
    }

    // Handle different possible simulation data structures
    let results = null;

    if (simulationData.results && Array.isArray(simulationData.results)) {
        results = simulationData.results;
    } else if (Array.isArray(simulationData)) {
        results = simulationData;
    } else {
        console.warn('extractPercentileData: Simulation data has no recognizable results structure:', Object.keys(simulationData));
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
                return result.percentile === percentile;
            }
            if (result.percentile.value) {
                return result.percentile.value === percentile;
            }
        }
        // Also check if result itself has a value property that matches
        if (result.value === percentile) {
            return true;
        }
        return false;
    });

    if (!percentileResult) {
        console.warn(`extractPercentileData: Percentile ${percentile} not found in results. Available:`,
            results.map(r => r.percentile?.value || r.percentile || 'unknown')
        );
        return [];
    }

    const extractedData = percentileResult.data || [];

    //console.log(`📊 Extracted P${percentile} data: ${extractedData.length} points for ${sourceConfig.id}`);

    return extractedData;
};

/**
 * Extract fixed data from configuration sources
 * @param {any} dataSource - Primary data: source data (array, object, or primitive)
 * @param {Object} dataReferences - Reference data: {reference: {}, global: {projectLife, numWTGs, currency}, context: {}}
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const extractFixedData = (dataSource, dataReferences, sourceConfig) => {
    const sourceData = dataSource;
    const { projectLife, numWTGs, currency } = dataReferences.global;

    if (!sourceData) {
        console.warn('extractFixedData: No source data provided');
        return [];
    }

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