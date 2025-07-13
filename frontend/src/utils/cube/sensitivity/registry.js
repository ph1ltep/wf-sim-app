// utils/cube/sensitivity/registry.js
import { computeTornadoAnalysis, computeCorrelationAnalysis } from './transformers';

/**
 * Sensitivity analysis registry following CubeSensitivityRegistrySchema
 * Defines available analysis types with transformers and validation schemas
 */
export const SENSITIVITY_REGISTRY = {
    analyses: [
        {
            id: 'tornado',
            name: 'Tornado Analysis',
            description: 'Single-variable sensitivity impact ranking',
            transformer: computeTornadoAnalysis,
            enabled: true,
            schema: Yup.object().shape({
                // Per-metric tornado results
                rankings: Yup.array().of(Yup.object().shape({
                    sourceId: Yup.string().required(),
                    impact: Yup.number().required(),
                    elasticity: Yup.number().required(),
                    rank: Yup.number().required(),
                    baseline: Yup.object().shape({
                        percentile: Yup.number().required(),
                        value: Yup.number().required()
                    }).required(),
                    perturbed: Yup.object().shape({
                        percentile: Yup.number().required(),
                        value: Yup.number().required()
                    }).required()
                })).required(),
                chartData: Yup.array().of(Yup.object().shape({
                    sourceId: Yup.string().required(),
                    low: Yup.number().required(),
                    high: Yup.number().required(),
                    impact: Yup.number().required()
                })).required()
            }),
            config: {
                percentileShift: 1, // How many percentile levels to shift for impact calculation
                rankingMetric: 'impact', // 'impact' | 'elasticity' | 'absolute'
                excludeMinorImpacts: true, // Filter out impacts below threshold
                impactThreshold: 0.01 // 1% minimum impact to include
            }
        },

        {
            id: 'correlation',
            name: 'Correlation Analysis',
            description: 'Multi-variable correlation matrix and heatmap data',
            transformer: computeCorrelationAnalysis,
            enabled: true,
            schema: Yup.object().shape({
                matrix: Yup.mixed().required(), // Map object with correlation pairs
                heatmapData: Yup.object().shape({
                    sources: Yup.array().of(Yup.string()).required(),
                    correlations: Yup.array().of(Yup.array().of(Yup.number())).required() // 2D correlation matrix
                }).required(),
                statistics: Yup.object().shape({
                    avgCorrelation: Yup.number().required(),
                    maxCorrelation: Yup.number().required(),
                    significantPairs: Yup.number().required() // Count of correlations above threshold
                }).required()
            }),
            config: {
                method: 'pearson', // 'pearson' | 'spearman' | 'kendall'
                significanceThreshold: 0.3, // Minimum correlation to consider significant
                heatmapFormat: true, // Whether to generate heatmap-ready data
                includeMetricSelf: false // Whether to include metric correlation with itself
            }
        },

        // Future analysis placeholder
        {
            id: 'sobol',
            name: 'Sobol Sensitivity Indices',
            description: 'Global sensitivity analysis using Sobol indices',
            transformer: null, // Not implemented yet
            enabled: false,
            schema: Yup.object().shape({
                firstOrder: Yup.object().required(), // First-order indices
                totalOrder: Yup.object().required(), // Total-order indices
                interactions: Yup.object().required() // Second-order interactions
            }),
            config: {
                sampleSize: 1000,
                confidenceLevel: 0.95,
                bootstrapSamples: 100
            }
        }
    ]
};

/**
 * Get analysis configuration by ID
 * @param {string} analysisId - Analysis ID to lookup
 * @returns {Object|null} Analysis configuration or null if not found
 */
export const getAnalysisConfig = (analysisId) => {
    return SENSITIVITY_REGISTRY.analyses.find(analysis => analysis.id === analysisId) || null;
};

/**
 * Get enabled analyses
 * @returns {Array} Array of enabled analysis configurations
 */
export const getEnabledAnalyses = () => {
    return SENSITIVITY_REGISTRY.analyses.filter(analysis => analysis.enabled);
};

/**
 * Validate analysis schema for results
 * @param {string} analysisId - Analysis ID
 * @param {Object} results - Results to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateAnalysisResults = (analysisId, results) => {
    const config = getAnalysisConfig(analysisId);
    if (!config) {
        return { isValid: false, errors: [`Unknown analysis: ${analysisId}`] };
    }

    try {
        config.schema.validateSync(results);
        return { isValid: true, errors: [] };
    } catch (error) {
        return { isValid: false, errors: [error.message] };
    }
};