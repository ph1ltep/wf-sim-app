// frontend/src/utils/cashflow/metrics/directReference.js

/**
 * Extract single percentile data across all metrics (PRD Addendum signature)
 * @param {Map} allMetricsData - Complete computed metrics (AllMetricsDataSchema)
 * @param {string} percentileKey - Target percentile ('p50', 'perSource', etc.)
 * @returns {Array} PercentileSliceDataSchema - One percentile across all metrics
 */
export const getSelectedPercentileData = (allMetricsData, percentileKey) => {
    if (!allMetricsData || !(allMetricsData instanceof Map)) {
        console.warn('getSelectedPercentileData: Invalid allMetricsData provided');
        return [];
    }

    const result = [];

    // Iterate through each metric in the computed metrics
    for (const [metricKey, percentileCollection] of allMetricsData) {
        if (!Array.isArray(percentileCollection)) {
            console.warn(`getSelectedPercentileData: Invalid percentile collection for metric ${metricKey}`);
            continue;
        }

        // Find the specific percentile in this metric's collection
        const percentileEntry = percentileCollection.find(([pKey]) => pKey === percentileKey);

        if (percentileEntry) {
            const [, metricResult] = percentileEntry;
            result.push([metricKey, metricResult]);
        }
    }

    return result;
};

/**
 * Get selected percentile key from selectedPercentiles object
 * @param {Object} selectedPercentiles - Current percentile selection
 * @returns {string} Percentile key for data lookup
 */
export const getSelectedPercentileKey = (selectedPercentiles) => {
    if (!selectedPercentiles) {
        return 'p50'; // Default fallback
    }

    if (selectedPercentiles.strategy === 'perSource') {
        return 'perSource';
    }

    // For unified strategy, use the unified percentile
    return `p${selectedPercentiles.unified || 50}`;
};

/**
 * Get current metric result for a specific metric and percentile
 * OPTIMIZED: Use percentileKey directly instead of selectedPercentiles object
 * @param {Map} computedMetrics - All computed metrics
 * @param {string} metricKey - Metric to lookup
 * @param {string} percentileKey - Direct percentile key ('p50', 'p75', 'perSource', etc.)
 * @returns {Object|null} Metric result or null if not found
 */
export const getCurrentMetricResult = (computedMetrics, metricKey, percentileKey) => {
    if (!computedMetrics || !computedMetrics.has(metricKey)) {
        return null;
    }

    const metricCollection = computedMetrics.get(metricKey);

    if (!Array.isArray(metricCollection)) {
        return null;
    }

    const percentileEntry = metricCollection.find(([pKey]) => pKey === percentileKey);
    return percentileEntry ? percentileEntry[1] : null;
};

/**
 * Get single metric across all percentiles (KEY MISSING FUNCTION)
 * @param {Map} allMetricsData - Complete computed metrics
 * @param {string} metricKey - Target metric
 * @returns {Array} Array of [percentileKey, MetricResult] for all percentiles of one metric
 */
export const getMetricAcrossPercentiles = (allMetricsData, metricKey) => {
    if (!allMetricsData || !allMetricsData.has(metricKey)) {
        console.warn(`getMetricAcrossPercentiles: Metric '${metricKey}' not found`);
        return [];
    }

    return allMetricsData.get(metricKey) || [];
};

/**
 * Get all available metrics from computed data
 * @param {Map} computedMetrics - Complete computed metrics
 * @returns {Array<string>} Array of available metric keys
 */
export const getAllAvailableMetrics = (computedMetrics) => {
    if (!computedMetrics || !(computedMetrics instanceof Map)) {
        return [];
    }

    return Array.from(computedMetrics.keys());
};

/**
 * Get multiple specific metrics for one percentile
 * @param {Map} allMetricsData - Complete computed metrics
 * @param {Array<string>} metricKeys - Target metrics
 * @param {string} percentileKey - Target percentile
 * @returns {Array} Array of [metricKey, MetricResult] for selected metrics
 */
export const getMultipleMetrics = (allMetricsData, metricKeys, percentileKey) => {
    if (!allMetricsData || !Array.isArray(metricKeys)) {
        return [];
    }

    const result = [];

    for (const metricKey of metricKeys) {
        if (allMetricsData.has(metricKey)) {
            const percentileCollection = allMetricsData.get(metricKey);
            if (Array.isArray(percentileCollection)) {
                const percentileEntry = percentileCollection.find(([pKey]) => pKey === percentileKey);
                if (percentileEntry) {
                    const [, metricResult] = percentileEntry;
                    result.push([metricKey, metricResult]);
                }
            }
        }
    }

    return result;
};