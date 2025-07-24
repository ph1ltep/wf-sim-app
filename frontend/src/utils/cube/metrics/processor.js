// utils/cube/metrics/processor.js
import { CubeMetricDataSchema, CubeMetricResultSchema } from 'schemas/yup/cube';
import { createAuditTrail } from '../audit';
import { extractPercentileMetric } from './transformers/common';

const Yup = require('yup');

/**
 * Process metrics registry data following metrics processing flow (parallel to computeSourceData)
 * @param {Object} metricsRegistry - CubeMetricsRegistrySchema with references and metrics
 * @param {Array} percentileInfo - percentileData object containing available percentiles and custom percentiles
 * @param {Function} getValueByPath - Function to extract data from scenario: (path: string[]) => any
 * @param {Function} getSourceData - Function to retrieve cube source data: (filters) => sourceData
 * @param {Object|null} customPercentile - Custom percentile configuration {sourceId: percentileValue} or null
 * @returns {Array} Array of CubeMetricDataSchema objects
 */
export const computeMetricsData = (metricsRegistry, percentileInfo, getValueByPath, getSourceData) => {
    console.log('🔄 Starting metrics data processing...');
    //const availablePercentiles = percentileInfo.available;
    //const useCustomPercentile = percentileInfo.strategy === 'unified' ? false : true;
    const startTime = performance.now();

    // Modify availablePercentiles if customPercentile is enabled
    // const effectivePercentiles = useCustomPercentile
    //     ? [...availablePercentiles, 0]
    //     : availablePercentiles;

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
                percentileInfo,
                getValueByPath,
                getSourceData
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
 * Validate and normalize metric data to CubeMetricResultSchema array
 * @param {any} metricData - Raw metric data from transformer
 * @param {Array} availablePercentiles - Available percentiles [10, 25, 50, 75, 90]
 * @returns {Array} Array of CubeMetricResultSchema objects
 * 
 * Acceptable input types:
 * - Array of CubeMetricResultSchema objects (returns as-is if valid)
 * - Single CubeMetricResultSchema object (replicates for all percentiles)
 * - Scalar value (number) - creates CubeMetricResultSchema array with value replicated
 * - Any other object - creates CubeMetricResultSchema array with object as value
 */
const validateMetricDataStructure = (metricData, availablePercentiles) => {
    if (!metricData) {
        // Return empty results for null/undefined
        return availablePercentiles.map(percentile => ({
            percentile: { value: percentile },
            value: 0,
            stats: {}
        }));
    }

    // Check if already compliant CubeMetricResultSchema array
    if (Array.isArray(metricData)) {
        try {
            // Direct Yup validation for CubeMetricResultSchema array
            Yup.array().of(CubeMetricResultSchema).validateSync(metricData);

            // Ensure we have results for all percentiles
            if (metricData.length === availablePercentiles.length) {
                return metricData;
            } else {
                console.warn(`validateMetricDataStructure: Array length ${metricData.length} doesn't match percentiles ${availablePercentiles.length}`);

                // Fill missing percentiles with zero values
                const result = [];
                availablePercentiles.forEach(percentile => {
                    const existingResult = metricData.find(item =>
                        item.percentile && item.percentile.value === percentile
                    );

                    if (existingResult) {
                        result.push(existingResult);
                    } else {
                        result.push({
                            percentile: { value: percentile },
                            value: 0,
                            stats: {}
                        });
                    }
                });

                return result;
            }
        } catch (error) {
            throw new Error(`Invalid CubeMetricResultSchema array format: ${error.message}`);
        }
    }

    // Handle single CubeMetricResultSchema object
    try {
        CubeMetricResultSchema.validateSync(metricData);

        // Replicate for all percentiles, preserving the original value and stats
        return availablePercentiles.map(percentile => ({
            percentile: { value: percentile },
            value: metricData.value,
            stats: { ...metricData.stats } // Clone stats object
        }));
    } catch (error) {
        // Not a valid CubeMetricResultSchema, continue to other checks
    }

    // Handle scalar values (numbers)
    if (typeof metricData === 'number' && !isNaN(metricData)) {
        return availablePercentiles.map(percentile => ({
            percentile: { value: percentile },
            value: metricData,
            stats: {}
        }));
    }

    // Handle any other object type - use as value
    if (typeof metricData === 'object') {
        return availablePercentiles.map(percentile => ({
            percentile: { value: percentile },
            value: metricData, // Store the entire object as value
            stats: {}
        }));
    }

    // Handle primitive types (string, boolean, etc.) - convert to number or 0
    let numericValue = 0;
    if (typeof metricData === 'string') {
        const parsed = parseFloat(metricData);
        numericValue = isNaN(parsed) ? 0 : parsed;
    } else if (typeof metricData === 'boolean') {
        numericValue = metricData ? 1 : 0;
    }

    return availablePercentiles.map(percentile => ({
        percentile: { value: percentile },
        value: numericValue,
        stats: {}
    }));
};

/**
 * Process individual metric through complete pipeline
 * @param {Object} metric - CubeMetricRegistryItemSchema
 * @param {Array} processedMetrics - Metrics processed so far in this run
 * @param {Object} globalReferences - Global reference data
 * @param {Array} percentileInfo - percentileData object containing available percentiles and custom
 * @param {Function} getValueByPath - Path extraction function
 * @param {Function} getSourceData - Source data retrieval function
 * @returns {Object} CubeMetricDataSchema
 */
const processMetric = (metric, processedMetrics, globalReferences, percentileInfo, getValueByPath, getSourceData) => {
    // Initialize audit trail for this metric
    const { addAuditEntry, getTrail, getReferences } = createAuditTrail(metric.id, 50, true);
    const { available: availablePercentiles } = percentileInfo;
    const useCustomPercentile = percentileInfo.strategy === 'unified' ? false : true;
    const customPercentile = percentileInfo.custom;

    // Modify availablePercentiles if customPercentile is enabled
    const effectivePercentiles = useCustomPercentile
        ? [...availablePercentiles, 0]
        : availablePercentiles;

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
            aggregationResults = applyAggregations(
                metric.aggregations,
                dependencies, // ✅ Pass full dependencies object
                effectivePercentiles,
                addAuditEntry
            );
        }
        // Step 4c: Apply transformer
        let transformerResults = null;
        if (metric.transformer) {
            transformerResults = applyTransformer(
                metric.transformer,
                dependencies, // ✅ Pass full dependencies object
                aggregationResults,
                effectivePercentiles,
                customPercentile,
                addAuditEntry
            );
        }

        // Step 4d: Set default values
        const finalResults = setDefaultValues(
            transformerResults,
            aggregationResults,
            metric.aggregations,
            effectivePercentiles
        );

        // Step 4e: Apply operations
        let operationResults = finalResults;
        if (metric.operations && metric.operations.length > 0) {
            operationResults = applyOperations(
                metric.operations,
                finalResults,
                dependencies, // ✅ Pass full dependencies object
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
 * @returns {Object} { sources: {}, metrics: {}, references: {} } - references includes ALL references
 */
const resolveDependencies = (dependencies, processedMetrics, globalReferences, getValueByPath, getSourceData) => {
    const resolved = {
        sources: {},
        metrics: {},
        references: { ...globalReferences } // Start with all global references
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
                        // Add local reference to the consolidated references object
                        resolved.references[dependency.id] = refValue;
                    } else {
                        throw new Error(`Reference '${dependency.id}' not found in global references and no path provided`);
                    }
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
 * @param {Object} dependencies - Resolved dependencies object with consolidated references
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Function} addAuditEntry - Audit trail function
 * @returns {Array} Array of CubeMetricResultSchema with stats populated
 */
const applyAggregations = (aggregationConfigs, dependencies, availablePercentiles, addAuditEntry) => {
    if (!aggregationConfigs || aggregationConfigs.length === 0) {
        return [];
    }

    // Resolve parameters once per metric (not per percentile or per aggregation)
    const resolvedConfigs = aggregationConfigs.map(config => {
        const resolvedConfig = { ...config };

        if (config.parameters) {
            resolvedConfig.resolvedParameters = {};

            Object.entries(config.parameters).forEach(([paramName, paramFunction]) => {
                if (typeof paramFunction === 'function') {
                    try {
                        resolvedConfig.resolvedParameters[paramName] = paramFunction(
                            dependencies.references,
                            dependencies.metrics
                        );
                    } catch (error) {
                        throw new Error(`Failed to resolve parameter '${paramName}' for aggregation '${config.outputKey}': ${error.message}`);
                    }
                } else {
                    resolvedConfig.resolvedParameters[paramName] = paramFunction;
                }
            });
        }

        return resolvedConfig;
    });

    // Initialize results array with empty stats for each percentile
    const results = availablePercentiles.map(percentile => ({
        percentile: { value: percentile },
        value: 0, // Will be set later by default values or transformer
        stats: {}
    }));

    // ✅ OPTIMIZED: Process each aggregation config once, apply to all percentiles
    resolvedConfigs.forEach(config => {
        const { sourceId, operation, outputKey, filter, resolvedParameters = {} } = config;

        // Get source data for all percentiles of this source
        const sourceData = dependencies.sources[sourceId];
        if (!sourceData) {
            console.warn(`⚠️ Source '${sourceId}' not found in dependencies`);
            // Set zero values for all percentiles for this outputKey
            results.forEach(result => {
                result.stats[outputKey] = 0;
            });
            return;
        }

        // ✅ Process each percentile's time-series separately for this aggregation
        availablePercentiles.forEach((percentile, percentileIndex) => {
            const percentileData = sourceData[percentile];
            if (!percentileData || !percentileData.data) {
                console.warn(`⚠️ Source '${sourceId}' data not found for percentile ${percentile}`);
                results[percentileIndex].stats[outputKey] = 0;
                return;
            }

            const timeSeriesData = percentileData.data; // Array of DataPointSchema for THIS percentile
            if (!Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
                results[percentileIndex].stats[outputKey] = 0;
                return;
            }

            // Apply filter if provided (filter operates on THIS percentile's data)
            let filteredData = timeSeriesData;
            if (filter && typeof filter === 'function') {
                try {
                    filteredData = timeSeriesData.filter(dataPoint =>
                        filter(dataPoint.year, dataPoint.value, dependencies.references)
                    );
                } catch (filterError) {
                    console.warn(`⚠️ Filter function failed for ${sourceId} P${percentile}: ${filterError.message}`);
                    filteredData = timeSeriesData;
                }
            }

            if (filteredData.length === 0) {
                console.warn(`⚠️ No data points passed filter for ${sourceId} at percentile ${percentile}`);
                results[percentileIndex].stats[outputKey] = 0;
                return;
            }

            // ✅ Aggregate THIS percentile's filtered time-series data
            let aggregatedValue;

            switch (operation) {
                case 'min':
                    const values = filteredData.map(dataPoint => dataPoint.value);
                    aggregatedValue = Math.min(...values);
                    break;
                case 'max':
                    const maxValues = filteredData.map(dataPoint => dataPoint.value);
                    aggregatedValue = Math.max(...maxValues);
                    break;
                case 'mean':
                    const meanValues = filteredData.map(dataPoint => dataPoint.value);
                    aggregatedValue = meanValues.reduce((sum, val) => sum + val, 0) / meanValues.length;
                    break;
                case 'sum':
                    const sumValues = filteredData.map(dataPoint => dataPoint.value);
                    aggregatedValue = sumValues.reduce((sum, val) => sum + val, 0);
                    break;
                case 'stdev':
                    const stdevValues = filteredData.map(dataPoint => dataPoint.value);
                    const mean = stdevValues.reduce((sum, val) => sum + val, 0) / stdevValues.length;
                    const variance = stdevValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / stdevValues.length;
                    aggregatedValue = Math.sqrt(variance);
                    break;
                case 'mode':
                    const modeValues = filteredData.map(dataPoint => dataPoint.value);
                    const frequency = {};
                    modeValues.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
                    aggregatedValue = Number(Object.keys(frequency).reduce((a, b) =>
                        frequency[a] > frequency[b] ? a : b));
                    break;
                case 'npv':
                    // NPV calculation on THIS percentile's time-series
                    const discountRate = resolvedParameters.discountRate;
                    if (discountRate === undefined) {
                        throw new Error(`NPV operation requires 'discountRate' parameter for '${outputKey}'`);
                    }

                    aggregatedValue = filteredData.reduce((npv, dataPoint) => {
                        const presentValue = dataPoint.value / Math.pow(1 + discountRate, dataPoint.year);
                        return npv + presentValue;
                    }, 0);
                    break;
                case 'reduce':
                    // Custom reduce on THIS percentile's time-series
                    const reducerFunction = resolvedParameters.reducer;
                    if (!reducerFunction || typeof reducerFunction !== 'function') {
                        throw new Error(`Reduce operation requires 'reducer' function parameter for '${outputKey}'`);
                    }

                    const initialValue = resolvedParameters.initialValue;
                    aggregatedValue = filteredData.reduce(reducerFunction, initialValue);
                    break;
                default:
                    throw new Error(`Unknown aggregation operation: ${operation}`);
            }

            // Store the aggregated value for THIS percentile
            results[percentileIndex].stats[outputKey] = aggregatedValue;
        });

        // Add audit entry for this aggregation config
        const parameterInfo = Object.keys(resolvedParameters).length > 0
            ? ` with parameters: ${Object.keys(resolvedParameters).join(', ')}`
            : '';
        addAuditEntry('aggregation_operation_applied',
            `applied ${operation}${parameterInfo} to ${availablePercentiles.length} percentiles for ${outputKey}`,
            [sourceId]);
    });

    addAuditEntry('aggregation_complete',
        `computed ${aggregationConfigs.length} aggregations for ${availablePercentiles.length} percentiles`,
        aggregationConfigs.map(config => config.sourceId),
        results);

    return results;
};

/**
 * Apply transformer to dependencies and context
 * @param {Function} transformer - Transformer function
 * @param {Object} dependencies - Resolved dependencies object with consolidated references
 * @param {Array} aggregationResults - Results from aggregations
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Object|null} customPercentile - Custom percentile config
 * @param {Function} addAuditEntry - Audit trail function
 * @returns {Array|null} Array of CubeMetricResultSchema or null
 */
const applyTransformer = (transformer, dependencies, aggregationResults, availablePercentiles, customPercentile, addAuditEntry) => {
    if (!transformer || typeof transformer !== 'function') {
        return null;
    }

    try {
        // Build context with consolidated references and dependencies
        const context = {
            availablePercentiles,
            aggregationResults,
            customPercentile,
            addAuditEntry
        };

        // Call transformer with dependencies and context
        const transformerResult = transformer(dependencies, context);

        // Validate and normalize transformer result using new validation function
        const validatedResults = validateMetricDataStructure(transformerResult, availablePercentiles);

        addAuditEntry('transformer_complete',
            `transformer returned ${validatedResults.length} results`,
            Object.keys(dependencies.sources).concat(Object.keys(dependencies.metrics)),
            validatedResults);

        return validatedResults;

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
 * @param {Object} dependencies - Resolved dependencies object with consolidated references
 * @param {Function} addAuditEntry - Audit trail function
 * @returns {Array} Array of CubeMetricResultSchema after operations
 */
const applyOperations = (operationConfigs, baseResults, dependencies, addAuditEntry) => {
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

        // Resolve operation target (metric or reference) - ✅ Direct access instead of .find()
        let targetData = null;

        // Check references first (consolidated)
        if (dependencies.references.hasOwnProperty(id)) {
            targetData = dependencies.references[id];
        } else if (dependencies.metrics.hasOwnProperty(id)) {
            // ✅ Direct access by key instead of array.find()
            targetData = dependencies.metrics[id];
        } else {
            throw new Error(`Operation target '${id}' not found in metrics or references`);
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
                    result.value,                    // baseValue
                    result.percentile.value,         // percentile
                    targetValue,                     // targetValue
                    dependencies.references,          // ✅ Use consolidated references
                    dependencies.metrics            // ✅ Use consolidated metrics
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