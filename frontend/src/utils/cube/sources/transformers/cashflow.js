import { filterCubeSourceData, aggregateCubeSourceData, adjustSourceDataValues } from './common.js';

/**
 * Calculate net cashflow by subtracting total costs from total revenue
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context with addAuditEntry
 * @returns {Array} Array of SimResultsSchema objects
 */
export const netCashflow = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile, addAuditEntry } = context;

    // Find totalRevenue and totalCost sources
    const totalRevenueSources = filterCubeSourceData(processedData, {
        sourceId: 'totalRevenue'
    });

    const totalCostSources = filterCubeSourceData(processedData, {
        sourceId: 'totalCost'
    });

    if (totalRevenueSources.length === 0 || totalCostSources.length === 0) {
        console.warn(`⚠️ Missing sources for netCashflow: totalRevenue(${totalRevenueSources.length}), totalCost(${totalCostSources.length})`);
        return [];
    }

    console.log('📊 Calculating netCashflow: totalRevenue - totalCost');

    // Track dependencies for audit trail
    const dependencies = ['totalRevenue', 'totalCost'];

    if (addAuditEntry) {
        addAuditEntry(
            'apply_netcashflow_calculation',
            'calculating netCashflow: totalRevenue - totalCost',
            dependencies
        );
    }

    // Get single sources (since sourceId filtering returns max 1 item)
    const revenueSource = totalRevenueSources[0];
    const costSource = totalCostSources[0];

    // Multiply cost values by -1 to convert to negative
    const negativeCostSource = adjustSourceDataValues(costSource, (percentile, year, value) => value * -1);

    // Combine revenue (positive) and cost (negative) sources
    const combinedSources = [revenueSource, negativeCostSource];

    // Aggregate with sum operation (revenue + (-cost) = revenue - cost)
    const result = aggregateCubeSourceData(combinedSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);

    console.log(`✅ netCashflow calculated for ${result.length} data points`);

    return result;
};