// frontend/src/utils/cashflow/metrics/directReference.js
/**
 * Direct Reference Architecture Helper Functions
 * Simple functions that work directly with the AllMetricsDataSchema structure
 */

/**
 * Get selected percentile key from selectedPercentiles object
 * @param {Object} selectedPercentiles - PercentileSelectionSchema
 * @returns {string} Percentile key (e.g., 'p50', 'perSource')
 */
export const getSelectedPercentileKey = (selectedPercentiles) => {
    if (!selectedPercentiles) return 'p50';
    return selectedPercentiles.strategy === 'unified' ?
        `p${selectedPercentiles.unified}` : 'perSource';
};

/**
 * Get current metric result for specified percentile
 * @param {Map} computedMetrics - AllMetricsDataSchema as Map
 * @param {string} metricKey - Metric identifier
 * @param {Object} selectedPercentiles - PercentileSelectionSchema
 * @returns {Object|null} MetricResult or null if not found
 */
export const getCurrentMetricResult = (computedMetrics, metricKey, selectedPercentiles) => {
    if (!computedMetrics?.has(metricKey)) return null;

    const percentileKey = getSelectedPercentileKey(selectedPercentiles);
    const metricPercentileCollection = computedMetrics.get(metricKey);
    const percentileEntry = metricPercentileCollection.find(([key]) => key === percentileKey);

    return percentileEntry ? percentileEntry[1] : null;
};

/**
 * Get selected percentile data across all metrics
 * @param {Map} computedMetrics - AllMetricsDataSchema as Map
 * @param {Object} selectedPercentiles - PercentileSelectionSchema  
 * @returns {Object} PercentileSliceDataSchema structure
 */
export const getSelectedPercentileData = (computedMetrics, selectedPercentiles) => {
    if (!computedMetrics || computedMetrics.size === 0) return null;

    const percentileKey = getSelectedPercentileKey(selectedPercentiles);
    const percentileSliceData = [];

    // Extract all metrics for the selected percentile - this creates PercentileSliceDataSchema
    computedMetrics.forEach((metricPercentileCollection, metricKey) => {
        const percentileEntry = metricPercentileCollection.find(([key]) => key === percentileKey);
        if (percentileEntry) {
            percentileSliceData.push([metricKey, percentileEntry[1]]);
        }
    });

    return percentileSliceData;
};

/**
 * Extract any metrics by keys (works for foundational, analytical, or mixed)
 * @param {Array} percentileSliceData - PercentileSliceDataSchema
 * @param {Array} metricKeys - Array of metric keys to extract
 * @returns {Object} Object with extracted metrics
 */
export const extractMetricsByKeys = (percentileSliceData, metricKeys) => {
    const extracted = {};
    metricKeys.forEach(key => {
        const entry = percentileSliceData.find(([metricKey]) => metricKey === key);
        if (entry) {
            extracted[key] = entry[1];
        }
    });
    return extracted;
};