// hooks/useSensitivityCube.js
import { useMemo, useCallback } from 'react';
import { useCube } from '../contexts/CubeContext';
import {
    SENSITIVITY_ANALYSES_REGISTRY,
    getAnalysisConfig,
    getFormatTransformer,
    getSupportedFormats,
    isAnalysisFormatSupported,
    getEnabledAnalysisTypes
} from '../utils/cube/sensitivity/registry';
import { getCorrelationValue } from '../utils/cube/sensitivity/processor';
import { createAuditTrail } from '../utils/cube/audit';
import { SensitivityQuerySchema } from 'schemas/yup/cube';

/**
 * Hook for accessing sensitivity analysis data with matrix-based operations
 * Provides unified interface for tornado, correlation, and custom sensitivity analyses
 * Integration Pattern: Similar to useCubeMetrics(), interfaces with CubeContext state
 * @returns {Object} Sensitivity analysis interface
 */
export const useCubeSensitivity = () => {
    const { sensitivityData, percentileInfo, isLoading, isRefreshing } = useCube();

    /**
     * Get sensitivity analysis results with flexible filtering and formatting
     * @param {Object} filters - Query configuration following SensitivityQuerySchema
     * @param {number[]} filters.percentiles - Percentiles to analyze (e.g., [50] or [25,50,75])
     * @param {string} filters.analysisType - Analysis type: 'tornado' | 'correlation' | 'impact' | 'custom'
     * @param {string[]} [filters.targetMetrics] - Specific metrics to analyze (optional, defaults to all enabled)
     * @param {string} [filters.format] - Output format (validated against transformer registry)
     * @param {Object} [filters.parameters] - Analysis-specific parameters
     * @returns {Object} Formatted analysis results with metadata
     */
    const getSensitivity = useCallback((filters) => {
        // Step 1: Validate query against schema
        try {
            SensitivityQuerySchema.validateSync(filters);
        } catch (error) {
            throw new Error(`Invalid sensitivity query: ${error.message}`);
        }

        const { percentiles, analysisType, targetMetrics, format, parameters = {} } = filters;

        // Step 2: Check if sensitivity data is available
        if (!sensitivityData?.percentileMatrices) {
            throw new Error('Sensitivity data not available. Ensure cube has been refreshed with sensitivity stage.');
        }

        // Step 3: Validate analysis type exists and is enabled
        const analysisConfig = getAnalysisConfig(analysisType);
        if (!analysisConfig) {
            const enabledTypes = getEnabledAnalysisTypes();
            throw new Error(`Analysis type '${analysisType}' not supported. Available types: ${enabledTypes.join(', ')}`);
        }

        // Step 4: Validate format if specified
        if (format && !isAnalysisFormatSupported(analysisType, format)) {
            const supportedFormats = getSupportedFormats(analysisType);
            throw new Error(`Format '${format}' not supported for '${analysisType}'. Supported formats: ${supportedFormats.join(', ')}`);
        }

        // Step 5: Check if requested percentiles exist in data
        const availablePercentiles = sensitivityData.percentileMatrices.map(m => m.percentile);
        const missingPercentiles = percentiles.filter(p => !availablePercentiles.includes(p));
        if (missingPercentiles.length > 0) {
            throw new Error(`Percentiles not available: ${missingPercentiles.join(', ')}. Available: ${availablePercentiles.join(', ')}`);
        }

        // Step 6: Extract relevant matrix data for requested percentiles
        const relevantMatrices = sensitivityData.percentileMatrices.filter(
            matrix => percentiles.includes(matrix.percentile)
        );

        // Step 7: Create audit trail for this query
        const { addAuditEntry, getTrail } = createAuditTrail();
        addAuditEntry('sensitivity_query', 'none',
            `Querying ${analysisType} analysis for percentiles: ${percentiles.join(', ')}`,
            [analysisType, format || 'raw']);

        // Step 8: Build analysis transformer context
        const transformerContext = {
            matrixData: relevantMatrices.length === 1 ? relevantMatrices[0] : relevantMatrices,
            query: {
                percentiles,
                analysisType,
                targetMetrics,
                format
            },
            config: { ...analysisConfig.defaultConfig, ...parameters },
            addAuditEntry
        };

        // Step 9: Apply analysis transformer
        let analysisResult;
        try {
            analysisResult = analysisConfig.transformer(transformerContext);
            addAuditEntry('analysis_transform', 'transform',
                `Applied ${analysisType} transformer successfully`,
                [`${relevantMatrices.length} matrices processed`]);
        } catch (error) {
            addAuditEntry('analysis_error', 'none', 'Analysis transformer failed', [error.message]);
            throw new Error(`Analysis transformation failed: ${error.message}`);
        }

        // Step 10: Apply format transformer if format specified
        if (format) {
            const formatTransformer = getFormatTransformer(analysisType, format);
            if (formatTransformer) {
                try {
                    const formattedResult = formatTransformer(analysisResult, parameters);
                    addAuditEntry('format_transform', 'transform',
                        `Applied ${format} format transformer`,
                        [analysisType]);

                    // Merge formatted result with original analysis metadata
                    return {
                        ...formattedResult,
                        query: filters,
                        audit: {
                            trail: getTrail(),
                            dependencies: analysisResult.audit?.dependencies || []
                        }
                    };
                } catch (error) {
                    addAuditEntry('format_error', 'none', 'Format transformer failed', [error.message]);
                    console.warn(`Format transformation failed for ${format}, returning raw analysis result`);
                }
            }
        }

        // Step 11: Return analysis result with audit trail
        return {
            ...analysisResult,
            query: filters,
            audit: {
                trail: getTrail(),
                dependencies: analysisResult.audit?.dependencies || []
            }
        };

    }, [sensitivityData]);

    /**
     * Get raw correlation matrix for specified percentile(s)
     * @param {number|number[]} percentiles - Single percentile or array
     * @returns {Object} Raw correlation matrix data
     */
    const getCorrelationMatrix = useCallback((percentiles) => {
        if (!sensitivityData?.percentileMatrices) {
            return null;
        }

        // Normalize to array
        const percentileArray = Array.isArray(percentiles) ? percentiles : [percentiles];

        const matrices = sensitivityData.percentileMatrices
            .filter(matrix => percentileArray.includes(matrix.percentile))
            .map(matrix => ({
                percentile: matrix.percentile,
                correlationMatrix: matrix.correlationMatrix,
                enabledMetrics: matrix.matrixMetadata.enabledMetrics
            }));

        return percentileArray.length === 1 ? matrices[0] : matrices;
    }, [sensitivityData]);

    /**
     * Get covariance matrix for specified percentile(s) 
     * @param {number|number[]} percentiles - Single percentile or array
     * @returns {Object} Raw covariance matrix data with metric mapping
     */
    const getCovarianceMatrix = useCallback((percentiles) => {
        if (!sensitivityData?.percentileMatrices) {
            return null;
        }

        // Normalize to array
        const percentileArray = Array.isArray(percentiles) ? percentiles : [percentiles];

        const matrices = sensitivityData.percentileMatrices
            .filter(matrix => percentileArray.includes(matrix.percentile))
            .map(matrix => ({
                percentile: matrix.percentile,
                covarianceMatrix: matrix.covarianceMatrix,
                enabledMetrics: matrix.matrixMetadata.enabledMetrics, // For row/column mapping
                dimensions: matrix.matrixMetadata.dimensions
            }));

        return percentileArray.length === 1 ? matrices[0] : matrices;
    }, [sensitivityData]);

    /**
     * Get tornado rankings for specific metric(s)
     * @param {Object} config - Tornado configuration
     * @param {number[]} config.percentiles - Percentiles to analyze
     * @param {string|string[]} config.targetMetrics - Target metric(s) for impact analysis
     * @param {string} [config.rankingMethod='correlation'] - Ranking method
     * @param {string} [config.format='raw'] - Output format
     * @returns {Object} Tornado rankings and impact data
     */
    /**
     * Get tornado rankings for specific metric(s)
     * @param {Object} config - Tornado configuration
     * @param {number[]} config.percentiles - Percentiles to analyze
     * @param {string|string[]} config.targetMetrics - Target metric(s) for impact analysis
     * @param {string} [config.rankingMethod='correlation'] - Ranking method
     * @param {string} [config.format='raw'] - Output format
     * @returns {Object} Tornado rankings and impact data
     */
    const getTornadoAnalysis = useCallback((config) => {
        const { percentiles, targetMetrics, rankingMethod = 'correlation', format = 'raw', ...otherParams } = config;

        return getSensitivity({
            percentiles,
            analysisType: 'tornado',
            targetMetrics: Array.isArray(targetMetrics) ? targetMetrics : [targetMetrics],
            format,
            parameters: {
                rankingMethod,
                ...otherParams
            }
        });
    }, [getSensitivity]);

    /**
     * Get correlation analysis for metric relationships
     * @param {Object} config - Correlation configuration  
     * @param {number[]} config.percentiles - Percentiles to analyze
     * @param {string[]} [config.metrics] - Specific metrics (optional, defaults to all enabled)
     * @param {string} [config.format='raw'] - Output format
     * @param {boolean} [config.includeInsignificant=false] - Include weak correlations
     * @returns {Object} Correlation matrix and statistics
     */
    const getCorrelationAnalysis = useCallback((config) => {
        const { percentiles, metrics, format = 'raw', includeInsignificant = false, ...otherParams } = config;

        return getSensitivity({
            percentiles,
            analysisType: 'correlation',
            targetMetrics: metrics,
            format,
            parameters: {
                includeInsignificant,
                ...otherParams
            }
        });
    }, [getSensitivity]);

    /**
     * Interpolate correlation value between computed percentiles
     * @param {Object} config - Interpolation configuration
     * @param {number} config.targetPercentile - Percentile to interpolate (e.g., 60)
     * @param {string} config.metricA - First metric ID
     * @param {string} config.metricB - Second metric ID  
     * @param {string} [config.method='linear'] - Interpolation method
     * @returns {number} Interpolated correlation value
     */
    const interpolateCorrelation = useCallback((config) => {
        const { targetPercentile, metricA, metricB, method = 'linear' } = config;

        if (!sensitivityData?.percentileMatrices) {
            return null;
        }

        const availablePercentiles = sensitivityData.percentileMatrices
            .map(m => m.percentile)
            .sort((a, b) => a - b);

        // Find bounding percentiles
        let lowerPercentile = null;
        let upperPercentile = null;

        for (let i = 0; i < availablePercentiles.length - 1; i++) {
            if (availablePercentiles[i] <= targetPercentile && availablePercentiles[i + 1] >= targetPercentile) {
                lowerPercentile = availablePercentiles[i];
                upperPercentile = availablePercentiles[i + 1];
                break;
            }
        }

        // Handle edge cases
        if (lowerPercentile === null || upperPercentile === null) {
            // Target percentile is outside computed range
            if (targetPercentile <= availablePercentiles[0]) {
                return getCorrelationValue(sensitivityData.percentileMatrices[0].correlationMatrix, metricA, metricB);
            } else if (targetPercentile >= availablePercentiles[availablePercentiles.length - 1]) {
                const lastMatrix = sensitivityData.percentileMatrices[sensitivityData.percentileMatrices.length - 1];
                return getCorrelationValue(lastMatrix.correlationMatrix, metricA, metricB);
            }
            return null;
        }

        // Get correlation values at bounding percentiles
        const lowerMatrix = sensitivityData.percentileMatrices.find(m => m.percentile === lowerPercentile);
        const upperMatrix = sensitivityData.percentileMatrices.find(m => m.percentile === upperPercentile);

        if (!lowerMatrix || !upperMatrix) {
            return null;
        }

        const lowerCorrelation = getCorrelationValue(lowerMatrix.correlationMatrix, metricA, metricB);
        const upperCorrelation = getCorrelationValue(upperMatrix.correlationMatrix, metricA, metricB);

        if (lowerCorrelation === null || upperCorrelation === null) {
            return null;
        }

        // Apply linear interpolation
        if (lowerPercentile === upperPercentile) {
            return lowerCorrelation; // Exact match
        }

        const ratio = (targetPercentile - lowerPercentile) / (upperPercentile - lowerPercentile);
        const interpolatedValue = lowerCorrelation + (upperCorrelation - lowerCorrelation) * ratio;

        return Number(interpolatedValue.toFixed(4));
    }, [sensitivityData]);

    /**
     * Interpolate metric impact given target metric value change
     * @param {Object} config - Impact interpolation configuration
     * @param {string} config.targetMetric - Metric being changed
     * @param {number} config.targetValue - New value for target metric  
     * @param {number} config.baselinePercentile - Baseline percentile for comparison
     * @param {string[]} [config.impactMetrics] - Metrics to calculate impact for (optional)
     * @returns {Object} Impact analysis showing effect on other metrics
     */
    const interpolateMetricImpact = useCallback((config) => {
        const { targetMetric, targetValue, baselinePercentile, impactMetrics } = config;

        if (!sensitivityData?.percentileMatrices) {
            return null;
        }

        // Find baseline matrix
        const baselineMatrix = sensitivityData.percentileMatrices.find(
            m => m.percentile === baselinePercentile
        );

        if (!baselineMatrix) {
            throw new Error(`Baseline percentile ${baselinePercentile} not found in sensitivity data`);
        }

        const enabledMetrics = baselineMatrix.matrixMetadata.enabledMetrics;
        const metricsToAnalyze = impactMetrics || enabledMetrics.filter(m => m !== targetMetric);

        // This would require baseline metric values - needs integration with getMetric()
        // For now, return structure showing what the analysis would contain
        const impacts = metricsToAnalyze.map(impactMetric => {
            const correlation = getCorrelationValue(baselineMatrix.correlationMatrix, targetMetric, impactMetric);

            return {
                impactMetric,
                correlation,
                estimatedImpact: correlation ? `${(correlation * 100).toFixed(1)}% correlation` : 'No correlation data',
                // TODO: Calculate actual impact using baseline values and target change
                baselineValue: null, // Would come from getMetric()
                estimatedNewValue: null // Would be calculated based on correlation
            };
        });

        return {
            targetMetric,
            targetValue,
            baselinePercentile,
            impacts,
            metadata: {
                method: 'correlation-based',
                note: 'Impact estimation based on correlation coefficients'
            }
        };
    }, [sensitivityData]);

    /**
     * Get available analysis types and their supported formats
     * @returns {Object} Registry information for available analyses and formats
     */
    const getAvailableAnalyses = useCallback(() => {
        const enabledAnalyses = SENSITIVITY_ANALYSES_REGISTRY.analyses
            .filter(analysis => analysis.enabled)
            .map(analysis => ({
                analysisType: analysis.analysisType,
                name: analysis.name,
                description: analysis.description,
                supportedFormats: analysis.supportedFormats.map(format => ({
                    format: format.format,
                    description: format.description
                })),
                defaultConfig: analysis.defaultConfig
            }));

        return {
            availableAnalyses: enabledAnalyses,
            globalConfig: SENSITIVITY_ANALYSES_REGISTRY.config,
            totalAnalysisTypes: enabledAnalyses.length
        };
    }, []);

    /**
     * Get sensitivity computation status and metadata
     * @returns {Object} Status information about sensitivity data
     */
    const getSensitivityStatus = useCallback(() => {
        if (!sensitivityData) {
            return {
                isAvailable: false,
                status: 'not_computed',
                message: 'Sensitivity data not available'
            };
        }

        const { percentileMatrices, metadata } = sensitivityData;

        return {
            isAvailable: true,
            status: 'available',
            computedAt: metadata?.computationStats?.computedAt,
            percentileCount: percentileMatrices?.length || 0,
            enabledMetricsCount: percentileMatrices?.[0]?.matrixMetadata?.enabledMetrics?.length || 0,
            matrixDimensions: percentileMatrices?.[0]?.matrixMetadata?.dimensions || 0,
            computationTime: metadata?.computationStats?.computationTime,
            memoryUsage: metadata?.computationStats?.memoryUsage,
            correlationMethod: metadata?.matrixConfig?.correlationMethod,
            availablePercentiles: percentileMatrices?.map(m => m.percentile).sort((a, b) => a - b) || []
        };
    }, [sensitivityData]);

    // Memoized values for performance
    const availablePercentiles = useMemo(() => {
        return percentileInfo?.available || [];
    }, [percentileInfo]);

    const isDataAvailable = useMemo(() => {
        return !!(sensitivityData?.percentileMatrices?.length > 0);
    }, [sensitivityData]);

    return {
        // Core access functions
        getSensitivity,
        getCorrelationMatrix,
        getCovarianceMatrix,
        interpolateCorrelation,
        interpolateMetricImpact,

        // Analysis-specific helpers
        getTornadoAnalysis,
        getCorrelationAnalysis,

        // Utility functions  
        getAvailableAnalyses,
        getSensitivityStatus,

        // State information
        isLoading,
        isRefreshing,
        isDataAvailable,
        sensitivityData,
        availablePercentiles
    };
};