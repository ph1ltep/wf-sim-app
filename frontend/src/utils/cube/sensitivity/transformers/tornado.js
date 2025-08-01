// utils/cube/sensitivity/transformers/tornado.js
import { generateMatrixKey, getCorrelationValue } from '../processor';

/**
 * Standard transformer input interface - all analysis transformers receive this
 * @typedef {Object} AnalysisTransformerContext
 * @property {Object|Object[]} matrixData - SensitivityMatrixResultSchema object(s) 
 * @property {Object} query - Original query parameters from getSensitivity()
 * @property {Object} config - Analysis-specific configuration from registry
 * @property {Function} addAuditEntry - Function to add audit trail entries
 */

/**
 * Tornado analysis transformer - extracts impact rankings from correlation matrix
 * @param {AnalysisTransformerContext} context - Standard transformer context
 * @returns {Object} Standardized analysis result with tornado-specific analysisResults
 */
export const computeTornadoFromMatrix = (context) => {
    const { matrixData, query, config, addAuditEntry } = context;

    // Step 1: Ensure matrixData is an array for consistent processing
    const matrixDataArray = Array.isArray(matrixData) ? matrixData : [matrixData];

    // Step 2: Extract target metrics from query or use all enabled metrics
    const targetMetrics = query.targetMetrics || matrixDataArray[0]?.matrixMetadata?.enabledMetrics || [];

    if (targetMetrics.length === 0) {
        throw new Error('No target metrics specified for tornado analysis');
    }

    // Step 3: Build tornado rankings for each percentile
    const tornadoResults = [];

    for (const percentileMatrix of matrixDataArray) {
        const { percentile, correlationMatrix, matrixMetadata } = percentileMatrix;
        const enabledMetrics = matrixMetadata.enabledMetrics;

        // Step 4: For each target metric, compute rankings
        const percentileRankings = [];

        for (const targetMetric of targetMetrics) {
            if (!enabledMetrics.includes(targetMetric)) {
                console.warn(`Target metric '${targetMetric}' not found in enabled metrics for P${percentile}`);
                continue;
            }

            // Step 5: Get correlations for this target metric with all other metrics
            const metricCorrelations = [];

            for (const inputMetric of enabledMetrics) {
                if (inputMetric === targetMetric) continue; // Skip self-correlation

                const correlation = getCorrelationValue(correlationMatrix, targetMetric, inputMetric);

                if (correlation !== null) {
                    const impact = Math.abs(correlation);
                    const elasticity = correlation; // For tornado, elasticity equals correlation

                    metricCorrelations.push({
                        targetMetric,
                        inputMetric,
                        correlation,
                        impact,
                        elasticity
                    });
                }
            }

            // Step 6: Rank by impact/correlation strength based on config
            const rankingMethod = config.rankingMethod || 'correlation';
            metricCorrelations.sort((a, b) => {
                switch (rankingMethod) {
                    case 'impact':
                        return b.impact - a.impact;
                    case 'absolute':
                        return Math.abs(b.correlation) - Math.abs(a.correlation);
                    case 'correlation':
                    default:
                        return Math.abs(b.correlation) - Math.abs(a.correlation);
                }
            });

            // Step 7: Filter by impact threshold and assign ranks
            const impactThreshold = config.impactThreshold || 0.01;
            const filteredRankings = metricCorrelations
                .filter(item => Math.abs(item.correlation) > impactThreshold)
                .map((item, index) => ({
                    ...item,
                    rank: index + 1
                }));

            percentileRankings.push(...filteredRankings);
        }

        tornadoResults.push({
            percentile,
            rankings: percentileRankings
        });
    }

    // Step 8: Add audit entry
    addAuditEntry('tornado_analysis', 'transform',
        `Computed tornado analysis for ${targetMetrics.length} target metrics across ${tornadoResults.length} percentiles`,
        targetMetrics);

    // Step 9: Return standardized analysis result
    return {
        analysisType: 'tornado',
        percentiles: query.percentiles,
        metadata: {
            name: 'Tornado Analysis',
            description: 'Variable impact ranking from correlation matrix',
            computedAt: new Date(),
            targetMetrics: targetMetrics,
            configuration: config
        },
        analysisResults: {
            results: tornadoResults,
            statistics: computeTornadoStatistics(tornadoResults)
        },
        audit: {
            trail: [], // Will be populated by calling function
            dependencies: matrixDataArray.flatMap(m => m.matrixMetadata.enabledMetrics)
        }
    };
};

/**
 * Compute statistics for tornado analysis results
 * @param {Array} tornadoResults - Array of tornado results per percentile
 * @returns {Object} Statistics summary
 */
const computeTornadoStatistics = (tornadoResults) => {
    if (tornadoResults.length === 0) return {};

    const allRankings = tornadoResults.flatMap(result => result.rankings);

    if (allRankings.length === 0) {
        return {
            totalRankings: 0,
            avgImpact: 0,
            maxImpact: 0,
            significantInputs: 0
        };
    }

    const impacts = allRankings.map(r => r.impact);
    const avgImpact = impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
    const maxImpact = Math.max(...impacts);

    // Count unique input metrics across all rankings
    const uniqueInputs = new Set(allRankings.map(r => r.inputMetric));

    return {
        totalRankings: allRankings.length,
        avgImpact: Number(avgImpact.toFixed(4)),
        maxImpact: Number(maxImpact.toFixed(4)),
        significantInputs: uniqueInputs.size
    };
};

/**
 * Format transformer for tornado chart visualization
 * @param {Object} analysisResult - Output from computeTornadoFromMatrix
 * @param {Object} formatConfig - Format-specific configuration
 * @returns {Object} Chart-ready data structure
 */
export const formatTornadoChart = (analysisResult, formatConfig = {}) => {
    const { analysisResults } = analysisResult;
    const { results } = analysisResults;

    if (!results || results.length === 0) {
        return {
            chartData: [],
            metadata: {
                format: 'chart',
                isEmpty: true,
                message: 'No tornado data available'
            }
        };
    }

    // Step 1: Get configuration
    const maxResults = formatConfig.maxResults || 10;
    const includeNegative = formatConfig.includeNegative !== false; // Default true

    // Step 2: Process each percentile's data
    const chartData = results.map(percentileResult => {
        const { percentile, rankings } = percentileResult;

        // Step 3: Take top N rankings and format for chart
        const chartRankings = rankings
            .slice(0, maxResults)
            .map(ranking => ({
                label: ranking.inputMetric,
                value: ranking.correlation,
                impact: ranking.impact,
                rank: ranking.rank,
                targetMetric: ranking.targetMetric,
                // For tornado chart: positive values go right, negative go left
                low: ranking.correlation < 0 ? ranking.correlation : 0,
                high: ranking.correlation > 0 ? ranking.correlation : 0
            }));

        return {
            percentile,
            data: chartRankings,
            metadata: {
                totalRankings: rankings.length,
                displayed: chartRankings.length
            }
        };
    });

    return {
        chartData,
        metadata: {
            format: 'chart',
            chartType: 'tornado',
            isEmpty: false,
            percentiles: results.map(r => r.percentile),
            configuration: formatConfig
        }
    };
};

/**
 * Format transformer for tornado table display
 * @param {Object} analysisResult - Output from computeTornadoFromMatrix
 * @param {Object} formatConfig - Format-specific configuration  
 * @returns {Object} Table-ready data structure
 */
export const formatTornadoTable = (analysisResult, formatConfig = {}) => {
    const { analysisResults } = analysisResult;
    const { results } = analysisResults;

    if (!results || results.length === 0) {
        return {
            tableData: [],
            columns: [],
            metadata: {
                format: 'table',
                isEmpty: true
            }
        };
    }

    // Step 1: Build table columns based on percentiles
    const percentiles = results.map(r => r.percentile).sort((a, b) => a - b);
    const columns = [
        { key: 'inputMetric', title: 'Input Metric', sortable: true },
        { key: 'targetMetric', title: 'Target Metric', sortable: true },
        ...percentiles.map(p => ({
            key: `P${p}`,
            title: `P${p} Correlation`,
            sortable: true,
            type: 'number',
            format: (value) => value ? value.toFixed(3) : '-'
        })),
        { key: 'avgImpact', title: 'Avg Impact', sortable: true, type: 'number' }
    ];

    // Step 2: Build table rows by combining data across percentiles
    const metricPairs = new Map(); // Track unique input-target pairs

    results.forEach(percentileResult => {
        const { percentile, rankings } = percentileResult;

        rankings.forEach(ranking => {
            const key = `${ranking.inputMetric}-${ranking.targetMetric}`;

            if (!metricPairs.has(key)) {
                metricPairs.set(key, {
                    inputMetric: ranking.inputMetric,
                    targetMetric: ranking.targetMetric,
                    correlations: {},
                    impacts: []
                });
            }

            const pair = metricPairs.get(key);
            pair.correlations[`P${percentile}`] = ranking.correlation;
            pair.impacts.push(ranking.impact);
        });
    });

    // Step 3: Build final table data
    const tableData = Array.from(metricPairs.values()).map(pair => {
        const avgImpact = pair.impacts.length > 0
            ? pair.impacts.reduce((sum, impact) => sum + impact, 0) / pair.impacts.length
            : 0;

        return {
            inputMetric: pair.inputMetric,
            targetMetric: pair.targetMetric,
            ...pair.correlations,
            avgImpact: Number(avgImpact.toFixed(4))
        };
    });

    // Step 4: Sort by average impact (descending)
    tableData.sort((a, b) => b.avgImpact - a.avgImpact);

    return {
        tableData,
        columns,
        metadata: {
            format: 'table',
            isEmpty: false,
            totalRows: tableData.length,
            percentiles: percentiles
        }
    };
};

/**
 * Format transformer for raw tornado data
 * @param {Object} analysisResult - Output from computeTornadoFromMatrix
 * @param {Object} formatConfig - Format-specific configuration
 * @returns {Object} Raw data structure
 */
export const formatTornadoRaw = (analysisResult, formatConfig = {}) => {
    // For raw format, return the analysis result as-is with minimal processing
    return {
        ...analysisResult,
        metadata: {
            ...analysisResult.metadata,
            format: 'raw'
        }
    };
};