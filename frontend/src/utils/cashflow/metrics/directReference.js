// frontend/src/utils/cashflow/metrics/directReference.js
// Direct reference helper functions for instant percentile switching

/**
 * Get data for the currently selected percentile/strategy from computed metrics
 * @param {Map} computedMetrics - Map of all computed metrics across all scenarios
 * @param {Object} selectedPercentiles - Current percentile selection from PercentileSelector
 * @returns {Object|null} CashflowDataSource-compatible structure for current selection
 */
export const getSelectedPercentileData = (computedMetrics, selectedPercentiles) => {
    if (!computedMetrics) return null;

    const selectedKey = getSelectedPercentileKey(selectedPercentiles);

    // Extract foundational metrics for current scenario
    const foundationalData = {};
    const foundationalMetrics = ['netCashflow', 'debtService', 'totalRevenue', 'totalCosts', 'totalCapex'];

    foundationalMetrics.forEach(metricKey => {
        const metricData = computedMetrics.get(metricKey);
        if (metricData && metricData[selectedKey]) {
            foundationalData[metricKey] = metricData[selectedKey];
        }
    });

    return {
        // Recreate structure that existing cards expect
        sources: extractSourcesFromFoundational(foundationalData),
        totals: extractTotalsFromFoundational(foundationalData),
        metadata: {
            selectedPercentiles,
            selectedKey,
            availablePercentiles: [10, 25, 50, 75, 90],
            isPerSource: selectedPercentiles.strategy === 'perSource',
            computedAt: new Date().toISOString()
        }
    };
};

/**
 * Determine the key for the currently selected percentile scenario
 * @param {Object} selectedPercentiles - Current percentile selection
 * @returns {string} Key for accessing computed metrics (e.g., 'p50', 'perSource')
 */
export const getSelectedPercentileKey = (selectedPercentiles) => {
    return selectedPercentiles.strategy === 'unified'
        ? `p${selectedPercentiles.unified}`
        : 'perSource';
};

/**
 * Transform foundational metrics back to totals format expected by existing cards
 * @param {Object} foundationalData - Foundational metric results for current scenario
 * @returns {Object} Totals structure compatible with existing card interfaces
 */
export const extractTotalsFromFoundational = (foundationalData) => {
    const totals = {};

    // Map foundational metrics to expected totals structure
    if (foundationalData.netCashflow) {
        totals.netCashflow = {
            data: foundationalData.netCashflow.value, // Time series array
            metadata: foundationalData.netCashflow.metadata
        };
    }

    if (foundationalData.totalRevenue) {
        totals.totalRevenue = {
            data: foundationalData.totalRevenue.value,
            metadata: foundationalData.totalRevenue.metadata
        };
    }

    if (foundationalData.totalCosts) {
        totals.totalCosts = {
            data: foundationalData.totalCosts.value,
            metadata: foundationalData.totalCosts.metadata
        };
    }

    if (foundationalData.totalCapex) {
        totals.totalCapex = {
            data: foundationalData.totalCapex.value,
            metadata: foundationalData.totalCapex.metadata
        };
    }

    if (foundationalData.debtService) {
        totals.debtService = {
            data: foundationalData.debtService.value,
            metadata: foundationalData.debtService.metadata
        };
    }

    return totals;
};

/**
 * Extract sources structure from foundational data (placeholder - can be enhanced)
 * @param {Object} foundationalData - Foundational metric results
 * @returns {Object} Sources structure compatible with existing cards
 */
export const extractSourcesFromFoundational = (foundationalData) => {
    // For now, return empty sources since cards primarily use totals
    // This can be enhanced later if cards need detailed source breakdowns
    return {};
};

/**
 * Get metric result for current scenario from computedMetrics
 * @param {Map} computedMetrics - All computed metrics
 * @param {string} metricKey - Key of the metric to retrieve
 * @param {Object} selectedPercentiles - Current percentile selection
 * @returns {Object|null} Current metric result with value, formatted, error, metadata
 */
export const getCurrentMetricResult = (computedMetrics, metricKey, selectedPercentiles) => {
    if (!computedMetrics || !metricKey) return null;

    const selectedKey = getSelectedPercentileKey(selectedPercentiles);
    const metricData = computedMetrics.get(metricKey);

    if (metricData && metricData[selectedKey]) {
        return metricData[selectedKey];
    }

    return null;
};