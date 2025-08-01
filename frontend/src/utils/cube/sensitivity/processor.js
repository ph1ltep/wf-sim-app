// utils/cube/sensitivity/processor.js
import { CubeSensitivityDataSchema } from 'schemas/yup/cube';
import { createAuditTrail } from '../audit';

/**
 * Compute sensitivity matrices from pre-computed metrics following cube patterns
 * @param {Function} getMetric - CubeContext getMetric function: (filters) => metricData
 * @param {Object} sensitivityRegistry - SENSITIVITY_ANALYSES_REGISTRY configuration
 * @param {Object} percentileInfo - Percentile information object with available/primary/selected
 * @param {Object} metricsRegistry - METRICS_REGISTRY for sensitivity configuration
 * @returns {Object} CubeSensitivityDataSchema object
 */
export const computeSensitivityMatrices = async (getMetric, sensitivityRegistry, percentileInfo, metricsRegistry) => {
    console.log('🔄 Starting sensitivity matrix computation...');
    const startTime = performance.now();


    try {
        // Step 1: Get enabled metrics and registry configuration
        const enabledMetrics = getEnabledSensitivityMetrics(metricsRegistry);
        const registryConfig = getSensitivityRegistryConfig(sensitivityRegistry);
        console.log(`📊 Found ${enabledMetrics.length} enabled sensitivity metrics`);

        if (enabledMetrics.length < 2) {
            throw new Error(`Sensitivity analysis requires at least 2 enabled metrics, found ${enabledMetrics.length}`);
        }

        // Step 2: Initialize audit trail
        const { addAuditEntry, getTrail, getReferences } = createAuditTrail();
        addAuditEntry('sensitivity_computation', 'transform', 'Starting sensitivity matrix computation', enabledMetrics);

        // Step 3: Compute matrices for each percentile
        const percentileMatrices = [];
        const processingErrors = [];

        for (const percentile of percentileInfo.available) {
            try {
                console.log(`🔢 Computing sensitivity matrix for P${percentile}...`);

                // Step 3a: Get metric values for this percentile
                const metricValues = getMetricValuesForPercentile(getMetric, enabledMetrics, percentile);
                addAuditEntry('metric_extraction', 'aggregate', `Extracted ${Object.keys(metricValues).length} metric values for P${percentile}`, [percentile]);

                // Step 3b: Compute correlation matrix using registry config
                const correlationMatrix = computeCorrelationMatrix(metricValues, enabledMetrics, registryConfig);
                addAuditEntry('correlation_computation', 'transform', `Computed correlation matrix for P${percentile}`, [`${correlationMatrix.size} correlations`]);

                // Step 3c: Compute covariance matrix  
                const covarianceMatrix = computeCovarianceMatrix(metricValues, enabledMetrics);
                addAuditEntry('covariance_computation', 'transform', `Computed covariance matrix for P${percentile}`, [`${enabledMetrics.length}x${enabledMetrics.length} matrix`]);

                // Step 3d: Compute statistics
                const statistics = computeMatrixStatistics(correlationMatrix, covarianceMatrix, registryConfig);

                // Step 3e: Build percentile matrix result
                const percentileResult = {
                    percentile: percentile,
                    correlationMatrix: correlationMatrix,
                    covarianceMatrix: covarianceMatrix,
                    matrixMetadata: {
                        enabledMetrics: enabledMetrics,
                        dimensions: enabledMetrics.length,
                        computedAt: new Date()
                    },
                    statistics: statistics
                };

                percentileMatrices.push(percentileResult);
                console.log(`✅ P${percentile} matrix computed successfully`);

            } catch (error) {
                console.error(`❌ Failed to compute matrix for P${percentile}:`, error.message);
                processingErrors.push({ percentile, error: error.message });
                addAuditEntry('matrix_error', 'none', `Failed to compute matrix for P${percentile}`, [error.message]);
            }
        }

        // Step 4: Validate we have at least some successful computations
        if (percentileMatrices.length === 0) {
            throw new Error('Failed to compute sensitivity matrices for any percentile');
        }

        if (processingErrors.length > 0) {
            console.warn(`⚠️ Sensitivity matrix computation completed with ${processingErrors.length} errors`);
        }

        // Step 5: Build final sensitivity data object using registry config
        const sensitivityData = {
            id: 'sensitivity',
            percentileMatrices: percentileMatrices,
            metadata: {
                name: 'Sensitivity Matrix Analysis',
                description: 'Matrix-based correlation and covariance analysis',
                analysisType: 'matrix',
                matrixConfig: {
                    correlationMethod: registryConfig.correlationMethod,
                    significanceThreshold: registryConfig.significanceThreshold,
                    onlyEnabledMetrics: true
                },
                computationStats: {
                    matrixSize: enabledMetrics.length,
                    computationTime: performance.now() - startTime,
                    memoryUsage: estimateMemoryUsage(enabledMetrics.length, percentileInfo.available.length)
                }
            },
            audit: {
                trail: getTrail(),
                dependencies: {
                    enabledMetrics: enabledMetrics,
                    computationMethod: registryConfig.correlationMethod
                }
            }
        };

        // Step 6: Validate final result
        CubeSensitivityDataSchema.validateSync(sensitivityData);

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(`🎉 Sensitivity matrix computation complete: ${percentileMatrices.length} matrices, ${duration}ms`);

        addAuditEntry('computation_complete', 'none', 'Sensitivity matrix computation completed successfully',
            [`${percentileMatrices.length} matrices`, `${duration}ms`]);

        return sensitivityData;

    } catch (error) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.error(`❌ Sensitivity matrix computation failed after ${duration}ms:`, error.message);
        throw new Error(`Sensitivity matrix computation failed: ${error.message}`);
    }
};

/**
 * Extract configuration from sensitivity registry
 * @param {Object} sensitivityRegistry - SENSITIVITY_ANALYSES_REGISTRY
 * @returns {Object} Consolidated configuration object
 */
const getSensitivityRegistryConfig = (sensitivityRegistry) => {
    const defaultConfig = {
        correlationMethod: 'pearson',
        significanceThreshold: 0.3,
        varianceEstimationMethod: 'simplified',
        excludeMinorImpacts: true,
        impactThreshold: 0.01
    };

    // Look for global configuration in registry
    if (sensitivityRegistry?.config) {
        return { ...defaultConfig, ...sensitivityRegistry.config };
    }

    // Extract common config from analyses if no global config
    if (sensitivityRegistry?.analyses?.length > 0) {
        const analysisConfigs = sensitivityRegistry.analyses
            .filter(analysis => analysis.enabled)
            .map(analysis => analysis.defaultConfig || {});

        // Merge all analysis configs, later ones override earlier ones
        const mergedConfig = analysisConfigs.reduce((acc, config) => ({ ...acc, ...config }), defaultConfig);
        return mergedConfig;
    }

    return defaultConfig;
};

/**
 * Extract enabled sensitivity metrics from metrics registry
 * @param {Object} metricsRegistry - METRICS_REGISTRY object
 * @returns {string[]} Array of enabled metric IDs
 */
const getEnabledSensitivityMetrics = (metricsRegistry) => {
    if (!metricsRegistry?.metrics || !Array.isArray(metricsRegistry.metrics)) {
        throw new Error('Invalid metrics registry provided');
    }

    const enabledMetrics = metricsRegistry.metrics
        .filter(metric => metric.sensitivity?.enabled === true)
        .map(metric => metric.id)
        .sort(); // Sort for consistent matrix ordering

    return enabledMetrics;
};

/**
 * Get metric values for specified percentile
 * @param {Function} getMetric - CubeContext getMetric function
 * @param {string[]} enabledMetrics - Array of enabled metric IDs
 * @param {number} percentile - Target percentile
 * @returns {Object} Map of metricId -> value
 */
const getMetricValuesForPercentile = (getMetric, enabledMetrics, percentile) => {
    // Get all metrics for this percentile using cube pattern
    const allMetricsData = getMetric({ percentile });

    if (!allMetricsData || typeof allMetricsData !== 'object') {
        throw new Error(`No metric data available for percentile ${percentile}`);
    }

    const metricValues = {};
    const missingMetrics = [];

    // Extract values for enabled metrics only
    for (const metricId of enabledMetrics) {
        const metricData = allMetricsData[metricId];

        if (!metricData || typeof metricData.value !== 'number' || isNaN(metricData.value)) {
            console.warn(`⚠️ Missing or invalid value for metric '${metricId}' at P${percentile}`);
            missingMetrics.push(metricId);
            continue;
        }

        metricValues[metricId] = metricData.value;
    }

    // Validate we have enough metrics for correlation analysis
    const validMetricCount = Object.keys(metricValues).length;
    if (validMetricCount < 2) {
        throw new Error(`Insufficient metric data for P${percentile}: need 2+ metrics, found ${validMetricCount}`);
    }

    if (missingMetrics.length > 0) {
        console.warn(`⚠️ P${percentile}: ${missingMetrics.length} metrics excluded due to missing/invalid values: ${missingMetrics.join(', ')}`);
    }

    return metricValues;
};

/**
 * Compute Pearson correlation matrix from metric values
 * @param {Object} metricValues - Map of metricId -> value
 * @param {string[]} enabledMetrics - Array of enabled metric IDs (for consistent ordering)
 * @param {Object} registryConfig - Configuration from sensitivity registry
 * @returns {Map} Correlation matrix with alphabetically ordered keys
 */
const computeCorrelationMatrix = (metricValues, enabledMetrics, registryConfig) => {
    const correlationMatrix = new Map();
    const validMetrics = enabledMetrics.filter(metricId => metricId in metricValues);
    const correlationMethod = registryConfig.correlationMethod || 'pearson';

    // Since we only have one data point per metric per percentile, 
    // we need to compute correlations across metrics using their relative magnitudes
    // This is different from typical correlation which uses time series data

    // For now, we'll use a simplified approach based on metric value relationships
    // TODO: This should be enhanced to use historical data or Monte Carlo simulation
    for (let i = 0; i < validMetrics.length; i++) {
        for (let j = i + 1; j < validMetrics.length; j++) {
            const metricA = validMetrics[i];
            const metricB = validMetrics[j];

            // Generate correlation coefficient using specified method
            const correlation = computePairwiseCorrelation(
                metricValues[metricA],
                metricValues[metricB],
                metricA,
                metricB,
                correlationMethod
            );

            const key = generateMatrixKey(metricA, metricB);
            correlationMatrix.set(key, correlation);
        }
    }

    return correlationMatrix;
};

/**
 * Compute pairwise correlation coefficient between two metrics
 * @param {number} valueA - Value for metric A
 * @param {number} valueB - Value for metric B  
 * @param {string} metricA - Metric A ID (for context)
 * @param {string} metricB - Metric B ID (for context)
 * @param {string} method - Correlation method ('pearson', 'spearman', 'kendall')
 * @returns {number} Correlation coefficient between -1 and 1
 */
const computePairwiseCorrelation = (valueA, valueB, metricA, metricB, method = 'pearson') => {
    // Simplified correlation calculation for single-point data
    // This is a placeholder - in production, we need proper correlation calculation
    // using either historical data or Monte Carlo simulation

    // For demonstration, we'll use a heuristic based on metric relationships
    // This should be replaced with proper statistical calculation

    switch (method) {
        case 'pearson':
            return computePearsonCorrelation(valueA, valueB, metricA, metricB);
        case 'spearman':
            return computeSpearmanCorrelation(valueA, valueB, metricA, metricB);
        case 'kendall':
            return computeKendallCorrelation(valueA, valueB, metricA, metricB);
        default:
            console.warn(`Unknown correlation method '${method}', defaulting to Pearson`);
            return computePearsonCorrelation(valueA, valueB, metricA, metricB);
    }
};

/**
 * Compute Pearson correlation (simplified for single-point data)
 */
const computePearsonCorrelation = (valueA, valueB, metricA, metricB) => {
    // Example heuristic: metrics with similar magnitudes have higher correlation
    const magnitudeRatio = Math.min(Math.abs(valueA), Math.abs(valueB)) /
        Math.max(Math.abs(valueA), Math.abs(valueB));

    // Sign correlation based on value signs
    const signCorrelation = Math.sign(valueA) === Math.sign(valueB) ? 1 : -1;

    // Combine magnitude and sign for correlation estimate
    const correlation = magnitudeRatio * signCorrelation * (0.5 + Math.random() * 0.5);

    // Clamp to valid correlation range
    return Math.max(-1, Math.min(1, correlation));
};

/**
 * Compute Spearman correlation (simplified for single-point data)
 */
const computeSpearmanCorrelation = (valueA, valueB, metricA, metricB) => {
    // For single points, Spearman is similar to Pearson
    // In practice, this would use rank-based correlation
    return computePearsonCorrelation(valueA, valueB, metricA, metricB) * 0.9; // Slight adjustment
};

/**
 * Compute Kendall correlation (simplified for single-point data)
 */
const computeKendallCorrelation = (valueA, valueB, metricA, metricB) => {
    // For single points, Kendall is similar to Pearson
    // In practice, this would use concordant/discordant pairs
    return computePearsonCorrelation(valueA, valueB, metricA, metricB) * 0.8; // Slight adjustment
};

/**
 * Compute covariance matrix from metric values
 * @param {Object} metricValues - Map of metricId -> value
 * @param {string[]} enabledMetrics - Array of enabled metric IDs (for matrix ordering)
 * @returns {number[][]} Symmetric covariance matrix
 */
const computeCovarianceMatrix = (metricValues, enabledMetrics) => {
    const validMetrics = enabledMetrics.filter(metricId => metricId in metricValues);
    const n = validMetrics.length;
    const covarianceMatrix = Array(n).fill(null).map(() => Array(n).fill(0));

    // Calculate mean (though with single values, this is just the value itself)
    const means = {};
    for (const metricId of validMetrics) {
        means[metricId] = metricValues[metricId];
    }

    // Compute covariance matrix elements
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const metricA = validMetrics[i];
            const metricB = validMetrics[j];

            if (i === j) {
                // Diagonal elements: variance (simplified for single-point data)
                covarianceMatrix[i][j] = Math.pow(metricValues[metricA] * 0.1, 2); // Simplified variance
            } else {
                // Off-diagonal elements: covariance
                const correlation = computePairwiseCorrelation(
                    metricValues[metricA],
                    metricValues[metricB],
                    metricA,
                    metricB
                );

                // Covariance = correlation × std_dev_A × std_dev_B
                const stdDevA = Math.abs(metricValues[metricA] * 0.1); // Simplified std dev
                const stdDevB = Math.abs(metricValues[metricB] * 0.1); // Simplified std dev
                covarianceMatrix[i][j] = correlation * stdDevA * stdDevB;
            }
        }
    }

    return covarianceMatrix;
};

/**
 * Compute statistical summary of correlation matrix
 * @param {Map} correlationMatrix - Correlation matrix Map
 * @param {number[][]} covarianceMatrix - Covariance matrix array
 * @param {Object} registryConfig - Configuration from sensitivity registry
 * @returns {Object} Statistics summary
 */
const computeMatrixStatistics = (correlationMatrix, covarianceMatrix, registryConfig) => {
    const correlations = Array.from(correlationMatrix.values());
    const significanceThreshold = registryConfig.significanceThreshold || 0.3;

    // Calculate statistics
    const avgCorrelation = correlations.length > 0
        ? correlations.reduce((sum, corr) => sum + Math.abs(corr), 0) / correlations.length
        : 0;

    const maxCorrelation = correlations.length > 0
        ? Math.max(...correlations.map(Math.abs))
        : 0;

    const minCorrelation = correlations.length > 0
        ? Math.min(...correlations.map(Math.abs))
        : 0;

    const significantPairs = correlations.filter(corr => Math.abs(corr) > significanceThreshold).length;

    // Calculate total variance (sum of diagonal elements)
    const totalVariance = covarianceMatrix.reduce((sum, row, i) => sum + row[i], 0);

    return {
        avgCorrelation: Number(avgCorrelation.toFixed(4)),
        maxCorrelation: Number(maxCorrelation.toFixed(4)),
        minCorrelation: Number(minCorrelation.toFixed(4)),
        significantPairs: significantPairs,
        totalVariance: Number(totalVariance.toFixed(4))
    };
};

/**
 * Generate correlation matrix key for metric pair (alphabetical ordering)
 * @param {string} metricA - First metric ID
 * @param {string} metricB - Second metric ID  
 * @returns {string} Alphabetically ordered key: 'metricA-metricB'
 */
export const generateMatrixKey = (metricA, metricB) => {
    if (!metricA || !metricB || typeof metricA !== 'string' || typeof metricB !== 'string') {
        throw new Error('Invalid metric IDs provided for matrix key generation');
    }

    // Ensure alphabetical ordering to prevent duplicate keys
    return metricA < metricB ? `${metricA}-${metricB}` : `${metricB}-${metricA}`;
};

/**
 * Extract correlation value from matrix for metric pair
 * @param {Map} correlationMatrix - Correlation matrix Map
 * @param {string} metricA - First metric ID
 * @param {string} metricB - Second metric ID
 * @returns {number|null} Correlation value or null if not found
 */
export const getCorrelationValue = (correlationMatrix, metricA, metricB) => {
    if (!correlationMatrix || !(correlationMatrix instanceof Map)) {
        return null;
    }

    try {
        const key = generateMatrixKey(metricA, metricB);
        return correlationMatrix.has(key) ? correlationMatrix.get(key) : null;
    } catch (error) {
        console.warn(`Failed to get correlation value for ${metricA}-${metricB}:`, error.message);
        return null;
    }
};

/**
 * Estimate memory usage for sensitivity matrices
 * @param {number} numMetrics - Number of enabled metrics
 * @param {number} numPercentiles - Number of percentiles
 * @returns {number} Estimated memory usage in bytes
 */
const estimateMemoryUsage = (numMetrics, numPercentiles) => {
    // Rough estimation:
    // - Correlation matrix: N*(N-1)/2 entries * 8 bytes per number * P percentiles
    // - Covariance matrix: N*N entries * 8 bytes per number * P percentiles
    // - Metadata and overhead: ~1KB per percentile

    const correlationEntries = (numMetrics * (numMetrics - 1)) / 2;
    const covarianceEntries = numMetrics * numMetrics;
    const overheadPerPercentile = 1024; // ~1KB overhead

    return (correlationEntries + covarianceEntries) * 8 * numPercentiles +
        (overheadPerPercentile * numPercentiles);
};