// src/utils/cashflow/transformers/simulationTransformer.js - Enhanced error handling
/**
 * Extract percentile data from simulation results
 */
export const extractPercentileData = (simulationData, sourceConfig, context = {}) => {
    // More robust validation
    if (!simulationData) {
        console.warn('extractPercentileData: No simulation data provided');
        return [];
    }

    if (!context.percentile) {
        console.warn('extractPercentileData: No percentile specified in context');
        return [];
    }

    // Handle different possible simulation data structures
    let results = null;

    if (simulationData.results) {
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

    return percentileResult.data || [];
};

/**
 * Extract fixed data from configuration sources
 */
export const extractFixedData = (sourceData, sourceConfig, context = {}) => {
    if (!sourceData) {
        console.warn('extractFixedData: No source data provided');
        return [];
    }

    // If data is already in correct format (array of {year, value})
    if (Array.isArray(sourceData)) {
        return sourceData.filter(item =>
            item &&
            typeof item.year === 'number' &&
            typeof item.value === 'number'
        );
    }

    // Handle single value (convert to time series)
    if (typeof sourceData === 'number') {
        const { projectLife = 20 } = context;
        const timeSeries = [];
        for (let year = 1; year <= projectLife; year++) {
            timeSeries.push({ year, value: sourceData });
        }
        return timeSeries;
    }

    console.warn('extractFixedData: Unsupported data format for:', sourceConfig.id);
    return [];
};