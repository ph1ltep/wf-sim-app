// frontend/src/utils/cube/sources/transformers/cashflow.js
import { filterCubeSourceData, aggregateCubeSourceData, adjustSourceDataValues } from './common.js';

/**
 * Calculate net cashflow by subtracting total costs from total revenue
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects
 */
export const netCashflow = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile } = context;

    // Find totalRevenue and totalCost sources (each returns single item since sourceId is unique)
    const totalRevenueSources = filterCubeSourceData(processedData, {
        sourceId: 'totalRevenue'
    });

    const totalCostSources = filterCubeSourceData(processedData, {
        sourceId: 'totalCost'
    });

    // Simplified length check with quantities
    if (totalRevenueSources.length === 0 || totalCostSources.length === 0) {
        console.warn(`⚠️ Missing sources for netCashflow: totalRevenue(${totalRevenueSources.length}), totalCost(${totalCostSources.length})`);
        return [];
    }

    console.log('📊 Calculating netCashflow: totalRevenue - totalCost');

    // Get single sources (since sourceId filtering returns max 1 item)
    const revenueSource = totalRevenueSources[0];
    const costSource = totalCostSources[0];

    // Multiply cost values by -1 to convert to negative
    const negativeCostSource = adjustSourceDataValues(costSource, (percentile, year, value) => -value);

    // Combine revenue (positive) and cost (negative) sources
    const combinedSources = [revenueSource, negativeCostSource];

    // Aggregate with sum operation (revenue + (-cost) = revenue - cost)
    const result = aggregateCubeSourceData(combinedSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    });

    console.log(`✅ netCashflow calculated for ${result.length} data points`);

    return result;
};