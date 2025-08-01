// utils/cube/sensitivity/registry.js
import { computeTornadoFromMatrix, formatTornadoRaw, formatTornadoChart, formatTornadoTable } from './transformers/tornado';

/**
 * Sensitivity analysis registry following CubeSensitivityRegistrySchema
 * Defines available analysis types with transformers and validation schemas
 */
export const SENSITIVITY_ANALYSES_REGISTRY = {
    // Global configuration for all analyses
    config: {
        correlationMethod: 'pearson',
        significanceThreshold: 0.3,
        varianceEstimationMethod: 'simplified',
        excludeMinorImpacts: true,
        impactThreshold: 0.01
    },

    analyses: [
        {
            analysisType: 'tornado',
            name: 'Tornado Analysis',
            description: 'Variable impact ranking from correlation matrix',
            transformer: computeTornadoFromMatrix,
            enabled: true,
            priority: 100,
            supportedFormats: [
                {
                    format: 'raw',
                    transformer: formatTornadoRaw,
                    description: 'Raw ranking data with correlations and impacts'
                },
                {
                    format: 'chart',
                    transformer: formatTornadoChart,
                    description: 'Chart-ready data for tornado visualization'
                },
                {
                    format: 'table',
                    transformer: formatTornadoTable,
                    description: 'Sortable table format with cross-percentile data'
                }
            ],
            defaultConfig: {
                rankingMethod: 'correlation', // 'correlation' | 'impact' | 'absolute'
                impactThreshold: 0.01,        // Minimum correlation to include
                maxResults: 10,               // Maximum results to return
                excludeMinorImpacts: true,    // Filter out impacts below threshold
                includeNegativeCorrelations: true
            }
        },

        // Placeholder for correlation analysis (to be implemented later)
        {
            analysisType: 'correlation',
            name: 'Correlation Analysis',
            description: 'Cross-metric correlation analysis from matrix',
            transformer: null, // To be implemented
            enabled: false,    // Disabled until implemented
            priority: 200,
            supportedFormats: [
                {
                    format: 'raw',
                    transformer: null,
                    description: 'Raw correlation matrix data'
                },
                {
                    format: 'heatmap',
                    transformer: null,
                    description: 'Heatmap-ready data structure'
                },
                {
                    format: 'network',
                    transformer: null,
                    description: 'Network graph data for correlation visualization'
                }
            ],
            defaultConfig: {
                significanceThreshold: 0.3,
                includeInsignificant: false,
                clustered: true
            }
        }
    ]
};

/**
 * Get analysis configuration by type
 * @param {string} analysisType - Analysis type to lookup
 * @returns {Object|null} Analysis configuration or null if not found
 */
export const getAnalysisConfig = (analysisType) => {
    return SENSITIVITY_ANALYSES_REGISTRY.analyses.find(
        analysis => analysis.analysisType === analysisType && analysis.enabled
    ) || null;
};

/**
 * Get format transformer for analysis type and format
 * @param {string} analysisType - Analysis type
 * @param {string} format - Format type
 * @returns {Function|null} Format transformer function or null if not found
 */
export const getFormatTransformer = (analysisType, format) => {
    const analysisConfig = getAnalysisConfig(analysisType);
    if (!analysisConfig) return null;

    const formatConfig = analysisConfig.supportedFormats.find(
        f => f.format === format
    );

    return formatConfig?.transformer || null;
};

/**
 * Get all supported formats for an analysis type
 * @param {string} analysisType - Analysis type
 * @returns {string[]} Array of supported format names
 */
export const getSupportedFormats = (analysisType) => {
    const analysisConfig = getAnalysisConfig(analysisType);
    if (!analysisConfig) return [];

    return analysisConfig.supportedFormats.map(f => f.format);
};

/**
 * Validate if analysis type and format combination is supported
 * @param {string} analysisType - Analysis type
 * @param {string} format - Format type
 * @returns {boolean} True if combination is supported
 */
export const isAnalysisFormatSupported = (analysisType, format) => {
    const supportedFormats = getSupportedFormats(analysisType);
    return supportedFormats.includes(format);
};

/**
 * Get all enabled analysis types
 * @returns {string[]} Array of enabled analysis type names
 */
export const getEnabledAnalysisTypes = () => {
    return SENSITIVITY_ANALYSES_REGISTRY.analyses
        .filter(analysis => analysis.enabled)
        .map(analysis => analysis.analysisType);
};