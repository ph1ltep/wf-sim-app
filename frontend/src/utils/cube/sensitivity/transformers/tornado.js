// utils/cube/sensitivity/transformers/tornado.js

/**
 * Compute tornado analysis for single-variable sensitivity ranking
 * @param {Object} context - Sensitivity analysis context
 * @returns {Object} Tornado analysis results
 */
export const computeTornadoAnalysis = (context) => {
    const {
        metricId,
        metricData,
        percentileSources,
        baselinePercentiles,
        analysisConfig,
        getSourceData,
        addAuditEntry
    } = context;

    // 1. For each baseline percentile:
    //    - Get baseline metric value
    //    - For each percentile source:
    //      - Calculate metric impact when source moves up one percentile level
    //      - Calculate elasticity = (% change in metric) / (% change in source)
    //      - Store impact and elasticity
    // 2. Rank sources by impact magnitude (or elasticity based on config)
    // 3. Filter out sources below impact threshold
    // 4. Build chart data with low/high values for tornado visualization
    // 5. Add audit entry with dependencies
    // Return: { rankings: [...], chartData: [...] }
};