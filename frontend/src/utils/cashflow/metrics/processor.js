// frontend/src/utils/cashflow/metrics/processor.js

/**
* Compute all metrics for all available percentiles - REPLACES transformScenarioToCashflow
* @param {PercentileSchema[]} availablePercentiles - Array of percentile objects: [{value: 10, description: 'extreme_lower'}, ...]
* @param {Record<string, number>} perSourcePercentiles - Object mapping sourceId to percentile value: {electricityPrice: 75, escalationRate: 25, ...}
* @param {Function} getValueByPath - Data extraction function: (path: string[]) => any
* @param {MetricsCube|null} cube - Optional cube for sensitivity analysis
* @returns {Promise<AllMetricsDataSchema>} Array of [metricKey, percentileCollection] pairs
*/
export const computeAllMetrics = async (availablePercentiles, perSourcePercentiles, getValueByPath, cube = null) => {
   // TODO: Build scenario list (p10, p25, p50, p75, p90, perSource if active)
   // TODO: Recursively call computePercentileScenario for each scenario
   // TODO: Aggregate results into AllMetricsDataSchema format
   // TODO: Initialize cube if provided
};

/**
* Compute all metrics for a single percentile scenario - CORE PROCESSING LOGIC
* @param {string} percentileKey - Target percentile key ('p50', 'p75', 'perSource', etc.)
* @param {Object} scenarioConfig - Scenario configuration: {type: 'perSource'|'unified', percentile?: number, sourcePercentiles?: Object}
* @param {Function} getValueByPath - Data extraction function: (path: string[]) => any
* @param {MetricsCube|null} cube - Optional cube for time-series storage
* @returns {Promise<Map<string, MetricResult>>} Map of metricKey to MetricResult for this percentile
*/
export const computePercentileScenario = async (percentileKey, scenarioConfig, getValueByPath, cube = null) => {
   // TODO: Phase 1 - Extract raw registry sources using existing CASHFLOW_SOURCE_REGISTRY patterns
   // TODO: Phase 2 - Process foundational metrics (type: 'foundational') in priority order (1-9)
   // TODO: Phase 3 - Process analytical metrics (type: 'analytical') in priority order (10+)
   // TODO: Phase 4 - Populate cube with foundational time-series if provided
   // TODO: Apply format() function to each result and store in displayValue
};

/**
* Build metric input structure for calculate() functions
* @param {string} metricKey - Metric identifier
* @param {MetricConfigSchema} config - Metric configuration from registry
* @param {Map<string, MetricResult>} computedResults - Already computed results (for dependencies)
* @param {Object} rawSources - Raw registry sources data
* @param {Function} getValueByPath - Data extraction function
* @returns {MetricInputSchema} Input structure for metric calculate() function
*/
export const createMetricInput = (metricKey, config, computedResults, rawSources, getValueByPath) => {
   // TODO: Build input structure based on metric type
   // TODO: For foundational: provide raw sources + foundational dependencies
   // TODO: For analytical: provide foundational results + raw data access
};

/**
* Resolve dependency computation order for metrics
* @param {MetricsRegistrySchema} registry - Complete metrics registry
* @returns {string[]} Array of metric keys in dependency order
*/
export const resolveDependencies = (registry) => {
   // TODO: Topological sort based on dependsOn arrays
   // TODO: Ensure foundational metrics (priority 1-9) come before analytical (10+)
};