// utils/cube/metrics/processor.js
import { CubeMetricDataSchema, CubeMetricResultSchema } from 'schemas/yup/cube';
import { createAuditTrail } from '../audit';

/**
 * Process metrics registry data following metrics processing flow (parallel to computeSourceData)
 * @param {Object} metricsRegistry - CubeMetricsRegistrySchema with references and metrics
 * @param {Array} availablePercentiles - Array of available percentiles [10, 25, 50, 75, 90]
 * @param {Function} getValueByPath - Function to extract data from scenario: (path: string[]) => any
 * @param {Function} getSourceData - Function to retrieve cube source data: (filters) => sourceData
 * @param {Object|null} customPercentile - Custom percentile configuration {sourceId: percentileValue} or null
 * @returns {Array} Array of CubeMetricDataSchema objects
 */
export const computeMetricsData = (metricsRegistry, availablePercentiles, getValueByPath, getSourceData, customPercentile = null) => {
    console.log('🔄 Starting metrics data processing...');
    const startTime = performance.now();

    // Step 1: Load global references
    const globalReferences = {};
    let referenceErrors = 0;

    metricsRegistry.references.forEach(ref => {
        try {
            const refValue = getValueByPath(ref.path);
            globalReferences[ref.id] = refValue;
        } catch (error) {
            console.error(`❌ Failed to load global reference '${ref.id}':`, error.message);
            referenceErrors++;
        }
    });

    console.log(`📚 Global references loaded: ${Object.keys(globalReferences).length}, errors: ${referenceErrors}`);

    // Step 2: Initialize processedMetrics
    const processedMetrics = [];

    // Step 3: Sort metrics by type (direct first, then indirect) and priority within type
    const sortedMetrics = [...metricsRegistry.metrics].sort((a, b) => {
        const typeOrder = { 'direct': 1, 'indirect': 2 };
        const typePriority = typeOrder[a.metadata.type] - typeOrder[b.metadata.type];
        return typePriority !== 0 ? typePriority : a.priority - b.priority;
    });

    let processedCount = 0;
    let errorCount = 0;

    // Step 4: Process each metric in sorted order
    for (const metric of sortedMetrics) {
        try {
            console.log(`🔄 Processing metric '${metric.id}' (${metric.metadata.type}, priority: ${metric.priority})`);

            const processedMetric = processMetric(
                metric,
                processedMetrics,
                globalReferences,
                availablePercentiles,
                getValueByPath,
                getSourceData,
                customPercentile
            );

            processedMetrics.push(processedMetric);
            processedCount++;
            console.log(`✅ Metric '${metric.id}' processed successfully`);

        } catch (error) {
            console.error(`❌ Failed to process metric '${metric.id}':`, error.message);
            errorCount++;
        }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.log(`🎉 Metrics processing complete: ${processedCount} metrics processed, ${errorCount} errors`);
    console.log(`⏱️ Total processing time: ${duration}ms`);

    return processedMetrics;
};

/**
 * Process individual metric through complete pipeline
 * @param {Object} metric - CubeMetricRegistryItemSchema
 * @param {Array} processedMetrics - Metrics processed so far in this run
 * @param {Object} globalReferences - Global reference data
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Function} getValueByPath - Path extraction function
 * @param {Function} getSourceData - Source data retrieval function
 * @param {Object|null} customPercentile - Custom percentile config
 * @returns {Object} CubeMetricDataSchema
 */
const processMetric = (metric, processedMetrics, globalReferences, availablePercentiles, getValueByPath, getSourceData, customPercentile) => {
    // Initialize audit trail for this metric
    const { addAuditEntry, getTrail, getReferences } = createAuditTrail(metric.id, 50, true);

    try {
        // Step 4a: Resolve dependencies
        addAuditEntry('resolve_dependencies', `resolving ${metric.dependencies.length} dependencies`, []);
        const dependencies = resolveDependencies(
            metric.dependencies,
            processedMetrics,
            globalReferences,
            getValueByPath,
            getSourceData
        );

        // Step 4b: Apply aggregations
        let aggregationResults = [];
        if (metric.aggregations && metric.aggregations.length > 0) {
            addAuditEntry('apply_aggregations', `applying ${metric.aggregations.length} aggregations`,
                metric.aggregations.map(agg => agg.sourceId));
            aggregationResults = applyAggregations(
                metric.aggregations,
                dependencies,
                availablePercentiles,
                addAuditEntry
            );
        }

        // Step 4c: Apply transformer
        let transformerResults = null;
        if (metric.transformer) {
            addAuditEntry('apply_transformer', 'applying metric transformer',
                Object.keys(dependencies.sources).concat(Object.keys(dependencies.metrics)));
            transformerResults = applyTransformer(
                metric.transformer,
                dependencies,
                processedMetrics,
                aggregationResults,
                availablePercentiles,
                globalReferences,
                customPercentile,
                addAuditEntry
            );
        }

        // Step 4d: Set default values
        const finalResults = setDefaultValues(
            transformerResults,
            aggregationResults,
            metric.aggregations,
            availablePercentiles
        );

        // Step 4e: Apply operations
        let operationResults = finalResults;
        if (metric.operations && metric.operations.length > 0) {
            addAuditEntry('apply_operations', `applying ${metric.operations.length} operations`,
                metric.operations.map(op => op.id));
            operationResults = applyOperations(
                metric.operations,
                finalResults,
                processedMetrics,
                globalReferences,
                addAuditEntry
            );
        }

        // Step 4f: Build CubeMetricDataSchema
        const trail = getTrail();
        const cubeMetricData = {
            id: metric.id,
            valueType: 'scalar', // Always scalar since value is number in schema
            percentileMetrics: operationResults,
            metadata: metric.metadata,
            audit: {
                trail: trail,
                references: getReferences(trail, globalReferences)
            }
        };

        // Validate the result
        try {
            CubeMetricDataSchema.validateSync(cubeMetricData);
        } catch (validationError) {
            throw new Error(`Invalid CubeMetricDataSchema for '${metric.id}': ${validationError.message}`);
        }

        return cubeMetricData;

    } catch (error) {
        addAuditEntry('processing_error', `Error: ${error.message}`, []);
        throw error;
    }
};

/**
 * Resolve metric dependencies from sources, metrics, and references
 * @param {Array} dependencies - Array of CubeMetricDependencySchema
 * @param {Array} processedMetrics - Metrics processed so far
 * @param {Object} globalReferences - Global reference data
 * @param {Function} getValueByPath - Path extraction function
 * @param {Function} getSourceData - Source data retrieval function
 * @returns {Object} { sources: {}, metrics: {}, references: {} }
 */
const resolveDependencies = (dependencies, processedMetrics, globalReferences, getValueByPath, getSourceData) => {
    const resolved = {
        sources: {},
        metrics: {},
        references: {}
    };

    dependencies.forEach(dependency => {
        try {
            switch (dependency.type) {
                case 'source':
                    // Use getSourceData to retrieve source by ID
                    const sourceData = getSourceData({ sourceId: dependency.id });
                    if (!sourceData || Object.keys(sourceData).length === 0) {
                        throw new Error(`Source '${dependency.id}' not found`);
                    }
                    resolved.sources[dependency.id] = sourceData;
                    break;

                case 'metric':
                    // Find metric in processedMetrics
                    const metric = processedMetrics.find(m => m.id === dependency.id);
                    if (!metric) {
                        throw new Error(`Metric '${dependency.id}' not found in processed metrics`);
                    }
                    resolved.metrics[dependency.id] = metric;
                    break;

                case 'reference':
                    // Check global references first, then use path if provided
                    let refValue;
                    if (globalReferences.hasOwnProperty(dependency.id)) {
                        refValue = globalReferences[dependency.id];
                    } else if (dependency.path) {
                        refValue = getValueByPath(dependency.path);
                    } else {
                        throw new Error(`Reference '${dependency.id}' not found in global references and no path provided`);
                    }
                    resolved.references[dependency.id] = refValue;
                    break;

                default:
                    throw new Error(`Unknown dependency type: ${dependency.type}`);
            }
        } catch (error) {
            throw new Error(`Failed to resolve dependency '${dependency.id}': ${error.message}`);
        }
    });

    return resolved;
};

/**
 * Apply aggregation operations to source time-series data
 * @param {Array} aggregationConfigs - Array of CubeMetricAggregationSchema
 * @param {Object} dependencies - Resolved dependencies object
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Function} addAuditEntry - Audit trail function
 * @returns {Array} Array of CubeMetricResultSchema with stats populated
 */
const applyAggregations = (aggregationConfigs, dependencies, availablePercentiles, globalReferences, addAuditEntry) => {
    if (!aggregationConfigs || aggregationConfigs.length === 0) {
        return [];
    }

    const results = [];

    // Process each percentile
    availablePercentiles.forEach(percentile => {
        const stats = {};

        // Apply each aggregation config
        aggregationConfigs.forEach(config => {
            const { sourceId, operation, outputKey, filter } = config;

            // Get source data for this percentile
            const sourceData = dependencies.sources[sourceId];
            if (!sourceData || !sourceData[percentile]) {
                console.warn(`⚠️ Source '${sourceId}' data not found for percentile ${percentile}`);
                stats[outputKey] = 0;
                return;
            }

            const timeSeriesData = sourceData[percentile].data; // Array of DataPointSchema
            if (!Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
                stats[outputKey] = 0;
                return;
            }

            // Apply filter if provided
            let filteredData = timeSeriesData;
            if (filter && typeof filter === 'function') {
                try {
                    filteredData = timeSeriesData.filter(dataPoint =>
                        filter(dataPoint.year, dataPoint.value, globalReferences)
                    );
                } catch (filterError) {
                    console.warn(`⚠️ Filter function failed for ${sourceId}: ${filterError.message}`);
                    filteredData = timeSeriesData; // Fall back to unfiltered data
                }
            }

            if (filteredData.length === 0) {
                console.warn(`⚠️ No data points passed filter for ${sourceId} at percentile ${percentile}`);
                stats[outputKey] = 0;
                return;
            }

            // Apply aggregation operation to filtered data
            const values = filteredData.map(dataPoint => dataPoint.value);
            let aggregatedValue;

            switch (operation) {
                case 'min':
                    aggregatedValue = Math.min(...values);
                    break;
                case 'max':
                    aggregatedValue = Math.max(...values);
                    break;
                case 'mean':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                    break;
                case 'sum':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                    break;
                case 'stdev':
                    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                    aggregatedValue = Math.sqrt(variance);
                    break;
                case 'mode':
                    // Find most frequent value (simplified implementation)
                    const frequency = {};
                    values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
                    aggregatedValue = Number(Object.keys(frequency).reduce((a, b) =>
                        frequency[a] > frequency[b] ? a : b));
                    break;
                default:
                    throw new Error(`Unknown aggregation operation: ${operation}`);
            }

            stats[outputKey] = aggregatedValue;

            // Add audit info about filtering
            if (filter) {
                addAuditEntry('aggregation_filter_applied',
                    `filtered ${timeSeriesData.length} to ${filteredData.length} data points for ${outputKey}`,
                    [sourceId]);
            }
        });

        // Create CubeMetricResultSchema for this percentile
        results.push({
            percentile: { value: percentile },
            value: 0, // Will be set later by default values or transformer
            stats: stats
        });
    });

    addAuditEntry('aggregation_complete',
        `computed ${aggregationConfigs.length} aggregations for ${availablePercentiles.length} percentiles`,
        aggregationConfigs.map(config => config.sourceId),
        results);

    return results;
};

/**
 * Apply transformer to dependencies and context (parallel to computeSourceData pattern)
 * @param {Function} transformer - Transformer function
 * @param {Object} dependencies - Resolved dependencies
 * @param {Array} processedMetrics - Metrics processed so far
 * @param {Array} aggregationResults - Results from aggregations
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Object} globalReferences - Global references
 * @param {Object|null} customPercentile - Custom percentile config
 * @param {Function} addAuditEntry - Audit trail function
 * @returns {Array|null} Array of CubeMetricResultSchema or null
 */
const applyTransformer = (transformer, dependencies, processedMetrics, aggregationResults, availablePercentiles, globalReferences, customPercentile, addAuditEntry) => {
    if (!transformer || typeof transformer !== 'function') {
        return null;
    }

    try {
        // Build context similar to cube sources
        const context = {
            availablePercentiles,
            allReferences: globalReferences,
            processedData: processedMetrics, // Metrics processed so far
            aggregationResults,
            customPercentile,
            addAuditEntry
        };

        // Call transformer with dependencies and context
        const transformerResult = transformer(dependencies, context);

        // Validate transformer result
        if (!Array.isArray(transformerResult)) {
            throw new Error('Transformer must return an array of CubeMetricResultSchema objects');
        }

        // Validate each result item
        transformerResult.forEach((item, index) => {
            try {
                CubeMetricResultSchema.validateSync(item);
            } catch (validationError) {
                throw new Error(`Invalid transformer result at index ${index}: ${validationError.message}`);
            }
        });

        addAuditEntry('transformer_complete',
            `transformer returned ${transformerResult.length} results`,
            Object.keys(dependencies.sources).concat(Object.keys(dependencies.metrics)),
            transformerResult);

        return transformerResult;

    } catch (error) {
        addAuditEntry('transformer_error', `Transformer failed: ${error.message}`, []);
        throw new Error(`Transformer execution failed: ${error.message}`);
    }
};

/**
 * Set default values from aggregations when transformer is absent/incomplete
 * @param {Array|null} transformerResults - Results from transformer
 * @param {Array} aggregationResults - Results from aggregations
 * @param {Array} aggregationConfigs - Original aggregation configs
 * @param {Array} availablePercentiles - Available percentiles
 * @returns {Array} Array of CubeMetricResultSchema with values set
 */
const setDefaultValues = (transformerResults, aggregationResults, aggregationConfigs, availablePercentiles) => {
    // If transformer results exist and are complete, return as-is
    if (transformerResults && Array.isArray(transformerResults) && transformerResults.length === availablePercentiles.length) {
        // Check if all results have valid values
        const allHaveValues = transformerResults.every(result =>
            typeof result.value === 'number' && !isNaN(result.value)
        );

        if (allHaveValues) {
            return transformerResults;
        }
    }

    // Need to use default values from aggregations
    if (!aggregationResults || aggregationResults.length === 0) {
        // No aggregations available, create zero-value results
        return availablePercentiles.map(percentile => ({
            percentile: { value: percentile },
            value: 0,
            stats: {}
        }));
    }

    // Find default aggregation configs
    const defaultConfigs = aggregationConfigs ? aggregationConfigs.filter(config => config.isDefault === true) : [];

    // Use last default config's output key, or first available stat if no defaults
    let defaultOutputKey = null;
    if (defaultConfigs.length > 0) {
        defaultOutputKey = defaultConfigs[defaultConfigs.length - 1].outputKey; // Use last default
    } else if (aggregationResults.length > 0 && aggregationResults[0].stats) {
        // Use first available stat key
        const statKeys = Object.keys(aggregationResults[0].stats);
        defaultOutputKey = statKeys.length > 0 ? statKeys[0] : null;
    }

    // Build results using default values
    const finalResults = aggregationResults.map((aggResult, index) => {
        let value = 0;

        if (defaultOutputKey && aggResult.stats && aggResult.stats.hasOwnProperty(defaultOutputKey)) {
            value = aggResult.stats[defaultOutputKey];
        }

        return {
            percentile: aggResult.percentile,
            value: value,
            stats: aggResult.stats || {}
        };
    });

    return finalResults;
};

/**
 * Apply operations to metric results using other metrics and references
 * @param {Array} operationConfigs - Array of CubeMetricOperationSchema
 * @param {Array} baseResults - Base metric results
 * @param {Array} processedMetrics - Metrics processed so far
 * @param {Object} globalReferences - Global references
 * @param {Function} addAuditEntry - Audit trail function
 * @returns {Array} Array of CubeMetricResultSchema after operations
 */
const applyOperations = (operationConfigs, baseResults, processedMetrics, globalReferences, addAuditEntry) => {
    if (!operationConfigs || operationConfigs.length === 0) {
        return baseResults;
    }

    let results = [...baseResults]; // Copy base results

    // Apply each operation in sequence
    operationConfigs.forEach(operationConfig => {
        const { id, operation } = operationConfig;

        if (typeof operation !== 'function') {
            throw new Error(`Operation for '${id}' must be a function`);
        }

        // Resolve operation target (metric or reference)
        let targetData = null;

        // Check if it's a reference first
        if (globalReferences.hasOwnProperty(id)) {
            targetData = globalReferences[id];
        } else {
            // Check if it's a metric
            const targetMetric = processedMetrics.find(metric => metric.id === id);
            if (targetMetric) {
                targetData = targetMetric;
            } else {
                throw new Error(`Operation target '${id}' not found in metrics or references`);
            }
        }

        // Apply operation to each percentile
        results = results.map(result => {
            try {
                let targetValue = targetData;

                // If target is a metric, extract the value for this percentile
                if (targetData && targetData.percentileMetrics) {
                    const percentileResult = targetData.percentileMetrics.find(
                        pm => pm.percentile.value === result.percentile.value
                    );
                    targetValue = percentileResult ? percentileResult.value : 0;
                }

                // Call operation function
                const newValue = operation(
                    result.value,           // baseValue
                    result.percentile.value, // percentile
                    targetValue,            // targetValue
                    globalReferences        // references
                );

                if (typeof newValue !== 'number' || isNaN(newValue)) {
                    throw new Error(`Operation returned invalid value: ${newValue}`);
                }

                return {
                    ...result,
                    value: newValue
                };

            } catch (error) {
                throw new Error(`Operation failed for percentile ${result.percentile.value}: ${error.message}`);
            }
        });
    });

    addAuditEntry('operations_complete',
        `applied ${operationConfigs.length} operations`,
        operationConfigs.map(config => config.id),
        results);

    return results;
};