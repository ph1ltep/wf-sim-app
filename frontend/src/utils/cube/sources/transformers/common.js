// frontend/src/utils/cube/sources/transformers/common.js
//const { } = require('schemas/yup/distribution');
const { CubeSourceDataSchema, SimResultsSchema, DataPointSchema } = require('schemas/yup/cube');

/**
 * Lightweight, optimized filtering for processedData in transformers
 * @param {Array} processedData - Array of CubeSourceDataSchema objects
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.sourceId] - Filter by specific source ID
 * @param {Array} [filters.sourceIds] - Filter by multiple source IDs
 * @param {Object} [filters.metadata] - Filter by metadata fields (exact matches)
 * @param {string} [filters.type] - Filter by metadata.type
 * @param {string} [filters.cashflowGroup] - Filter by metadata.cashflowGroup
 * @param {string} [filters.category] - Filter by metadata.category
 * @returns {Array} Filtered array of CubeSourceDataSchema objects
 */
export const filterCubeSourceData = (processedData, filters = {}) => {
    if (!Array.isArray(processedData) || processedData.length === 0) {
        return [];
    }

    const {
        sourceId,
        sourceIds,
        metadata: metadataFilters,
        type,
        cashflowType,
        visualGroup,
        accountingClass,
        projectPhase,
        name,
        customPercentile
    } = filters;

    // Early return if no filters
    if (!sourceId && !sourceIds && !metadataFilters && !type && !cashflowType && !visualGroup && !accountingClass && !projectPhase && !name && !customPercentile) {
        return processedData;
    }

    return processedData.filter(source => {
        // Filter by single sourceId (most selective)
        if (sourceId && source.id !== sourceId) {
            return false;
        }

        // Filter by multiple sourceIds
        if (sourceIds && !sourceIds.includes(source.id)) {
            return false;
        }

        // Filter by common metadata shortcuts (optimized)
        if (type && source.metadata.type !== type) {
            return false;
        }

        if (cashflowType && source.metadata.cashflowType !== cashflowType) {
            return false;
        }

        if (visualGroup && source.metadata.visualGroup !== visualGroup) {
            return false;
        }

        if (accountingClass && source.metadata.accountingClass !== accountingClass) {
            return false;
        }

        if (projectPhase && source.metadata.projectPhase !== projectPhase) {
            return false;
        }

        if (name && source.metadata.name !== name) {
            return false;
        }
        if (customPercentile && source.metadata.customPercentile !== customPercentile) {
            return false;
        }

        // Filter by custom metadata (least selective, done last)
        if (metadataFilters && typeof metadataFilters === 'object') {
            for (const [key, value] of Object.entries(metadataFilters)) {
                if (source.metadata[key] !== value) {
                    return false;
                }
            }
        }

        return true;
    });
};

/**
 * Aggregate multiple CubeSourceDataSchema objects into a single time-series
 * @param {Array} sources - Array of CubeSourceDataSchema objects to aggregate
 * @param {Array} availablePercentiles - Available percentiles for output structure
 * @param {Object} options - Aggregation options
 * @param {string} [options.operation='sum'] - Aggregation operation ('sum', 'subtract', 'multiply')
 * @param {Object|null} [options.customPercentile] - Custom percentile configuration {sourceId: percentileValue}
 * @param {Function|null} [addAuditEntry] - Optional audit trail function
 * @returns {Array} Array of SimResultsSchema objects with aggregated values
 */
export const aggregateCubeSourceData = (sources, availablePercentiles, options = {}, addAuditEntry = null) => {
    const { operation = 'sum', customPercentile } = options;

    if (!Array.isArray(sources) || sources.length === 0) {
        return [];
    }

    // Determine effective percentiles
    const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
        ? [...availablePercentiles, 0]
        : availablePercentiles;

    // Create result array - one SimResultsSchema per percentile
    const result = [];

    effectivePercentiles.forEach(percentile => {
        // Create aggregation map for this percentile: year -> value
        const aggregationMap = new Map();

        // Process each source for this percentile
        sources.forEach(source => {
            if (!source.percentileSource || !Array.isArray(source.percentileSource)) {
                return;
            }

            source.percentileSource.forEach(simResult => {
                let targetPercentile = simResult.percentile.value;

                // Handle custom percentile for percentile 0
                if (targetPercentile === 0 && customPercentile) {
                    // Look up actual percentile to use for this source
                    const customPercentileValue = customPercentile[source.id];
                    if (customPercentileValue !== undefined) {
                        // Find the corresponding data with the custom percentile value
                        const customData = source.percentileSource.find(dataItem =>
                            dataItem.percentile.value === customPercentileValue
                        );

                        if (customData) {
                            // Use the custom percentile data but maintain output percentile as 0
                            if (targetPercentile === 0) {
                                customData.data.forEach(dataPoint => {
                                    const currentValue = aggregationMap.get(dataPoint.year) || 0;
                                    switch (operation) {
                                        case 'sum':
                                            aggregationMap.set(dataPoint.year, currentValue + dataPoint.value);
                                            break;
                                        case 'subtract':
                                            aggregationMap.set(dataPoint.year, currentValue - dataPoint.value);
                                            break;
                                        case 'multiply':
                                            aggregationMap.set(dataPoint.year, currentValue === 0 ? dataPoint.value : currentValue * dataPoint.value);
                                            break;
                                        case 'divide':
                                            aggregationMap.set(dataPoint.year, currentValue === 0 ? dataPoint.value : currentValue / dataPoint.value);
                                            break;
                                        default:
                                            aggregationMap.set(dataPoint.year, currentValue + dataPoint.value);
                                    }
                                });
                            }
                            return; // Skip normal processing for this simResult
                        }
                    }
                    // If no custom percentile found, fall back to default (percentile 0)
                }

                // Normal aggregation - only process if this simResult matches our target percentile
                if (targetPercentile === percentile) {
                    simResult.data.forEach(dataPoint => {
                        const currentValue = aggregationMap.get(dataPoint.year) || 0;

                        switch (operation) {
                            case 'sum':
                                aggregationMap.set(dataPoint.year, currentValue + dataPoint.value);
                                break;
                            case 'subtract':
                                aggregationMap.set(dataPoint.year, currentValue - dataPoint.value);
                                break;
                            case 'multiply':
                                aggregationMap.set(dataPoint.year, currentValue === 0 ? dataPoint.value : currentValue * dataPoint.value);
                                break;
                            case 'divide':
                                aggregationMap.set(dataPoint.year, currentValue === 0 ? dataPoint.value : currentValue / dataPoint.value);
                                break;
                            default:
                                aggregationMap.set(dataPoint.year, currentValue + dataPoint.value);
                        }
                    });
                }
            });
        });

        // Convert aggregation map to DataPointSchema array for this percentile
        const dataPoints = Array.from(aggregationMap.entries())
            .map(([year, value]) => ({
                year: parseInt(year, 10),
                value: value
            }))
            .sort((a, b) => a.year - b.year);

        // Create one SimResultsSchema for this percentile
        result.push({
            name: `aggregated_${operation}`, // Generic name for aggregated result
            data: dataPoints,
            percentile: { value: percentile }
        });
    });

    // Track dependencies for audit trail
    const dependencies = sources.map(source => source.id);

    // Add audit entry if function provided
    if (addAuditEntry) {
        addAuditEntry(
            'apply_aggregation',
            `aggregating ${sources.length} sources (${operation})`,
            dependencies,
            result, // No source data for aggregation
            'aggregate',
            operation
        );
    }

    return result;
};

/**
 * Extract specific percentile data from SimResultsSchema array
 * @param {Array} data - Array of SimResultsSchema objects
 * @param {number} percentile - Percentile to extract
 * @returns {Array} Array of DataPointSchema objects
 */
export const extractPercentileData = (data, percentile) => {
    if (!Array.isArray(data)) return [];

    // Filter to the specific percentile (should return only one SimResultsSchema)
    const percentileResult = data.find(item => item.percentile && item.percentile.value === percentile);

    // Return the .data array (DataPointSchema[]) or empty array if not found
    const result = percentileResult ? percentileResult.data : [];
    return result
};

/**
 * Adjust values in source data using an inline transformation function
 * @param {Array|Object} sourceData - CubeSourceDataSchema array/object, SimResultsSchema array/object, or DataPointSchema array
 * @param {Function} adjustFunction - Function to transform each value: (percentile, year, value, previousValue) => newValue
 * @returns {Array|Object} Transformed data in same format as input
 * ✅ Valid calls
 * const doubled = adjustSourceDataValues(data, (percentile, year, value) => value * 2);
 * const cumulative = adjustSourceDataValues(data, (percentile, year, value, previousValue=null) => value + (previousValue || 0));
 */
export const adjustSourceDataValues = (sourceData, adjustFunction, addAuditEntry = null) => {
    if (!sourceData || typeof adjustFunction !== 'function') {
        return sourceData;
    }

    // Handle single object vs array
    const isArray = Array.isArray(sourceData);
    const dataToProcess = isArray ? sourceData : [sourceData];

    if (dataToProcess.length === 0) {
        return sourceData;
    }

    // Detect data type using schema validation (single pass)
    const firstItem = dataToProcess[0];
    let dataType;

    try {
        CubeSourceDataSchema.validateSync(firstItem);
        dataType = 'CubeSourceData';
    } catch (error) {
        try {
            SimResultsSchema.validateSync(firstItem);
            dataType = 'SimResults';
        } catch (error2) {
            try {
                DataPointSchema.validateSync(firstItem);
                dataType = 'DataPoint';
            } catch (error3) {
                throw new Error('Invalid source data format for adjustSourceDataValues');
            }
        }
    }

    // Process based on detected type
    let result;

    switch (dataType) {
        case 'CubeSourceData':
            result = dataToProcess.map(cubeSource => ({
                ...cubeSource,
                percentileSource: cubeSource.percentileSource.map(simResult => {
                    let previousValue = null;
                    return {
                        ...simResult,
                        data: simResult.data.map(dataPoint => {
                            const newValue = adjustFunction(simResult.percentile.value, dataPoint.year, dataPoint.value, previousValue);
                            previousValue = newValue;
                            return {
                                ...dataPoint,
                                value: newValue
                            };
                        })
                    };
                })
            }));
            break;

        case 'SimResults':
            result = dataToProcess.map(simResult => {
                let previousValue = null;
                return {
                    ...simResult,
                    data: simResult.data.map(dataPoint => {
                        const newValue = adjustFunction(simResult.percentile.value, dataPoint.year, dataPoint.value, previousValue);
                        previousValue = newValue;
                        return {
                            ...dataPoint,
                            value: newValue
                        };
                    })
                };
            });
            break;

        case 'DataPoint':
            let previousValue = null;
            result = dataToProcess.map(dataPoint => {
                const newValue = adjustFunction(50, dataPoint.year, dataPoint.value, previousValue); // Default percentile for DataPoint
                previousValue = newValue;
                return {
                    ...dataPoint,
                    value: newValue
                };
            });
            break;

        default:
            throw new Error('Unsupported data type for adjustSourceDataValues');
    }

    // Add audit entry if function provided
    if (addAuditEntry) {
        addAuditEntry(
            'apply_adjustment',
            `adjusted ${sourceData.length} by (${adjustFunction.toString()})`,
            null,
            result,
            'transform',
            'adjust'
        );
    }

    // Return in same format as input (array or single object)
    return isArray ? result : result[0];
};

/**
 * Transform DataPointSchema array into SimResultsSchema array
 * @param {Array} dataPoints - Array of DataPointSchema objects {year, value}
 * @param {Array} availablePercentiles - Available percentiles to create entries for
 * @param {string} name - Name for the SimResultsSchema entries
 * @param {Object|null} customPercentile - Custom percentile configuration
 * @returns {Array} Array of SimResultsSchema objects {name, data, percentile}
 */
export const normalizeIntoSimResults = (dataPoints, availablePercentiles, name, customPercentile = null, addAuditEntry = null) => {
    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
        return [];
    }

    const result = [];

    // Create one SimResultsSchema entry per available percentile
    availablePercentiles.forEach(percentile => {
        result.push({
            name,
            data: [...dataPoints], // Same data array for each percentile
            percentile: { value: percentile }
        });
    });

    // Add custom percentile entry if configured
    if (customPercentile) {
        result.push({
            name,
            data: [...dataPoints], // Same data array
            percentile: { value: 0 }
        });
    }

    // Add audit entry if function provided
    if (addAuditEntry) {
        addAuditEntry(
            'apply_normalization',
            `normalized fixed time-series into ${availablePercentiles.length} percentiles`,
            null,
            result,
            'normalize',
            'none'
        );
    }

    return result;
};

/**
 * Trim/filter source data using a comparator function with options
 * @param {Array|Object} sourceData - CubeSourceDataSchema array/object, SimResultsSchema array/object, or DataPointSchema array
 * @param {Function} trimFunction - Function to filter each value: (year, value, options) => boolean (true = remove item)
 * @param {Object} options - Options object passed to trimFunction (e.g., { min: 1, max: 10 })
 * @param {Function|null} addAuditEntry - Optional audit trail function
 * @returns {Array|Object} Filtered data in same format as input
 * ✅ Valid calls
 * const afterYear5 = trimSourceDataValues(data, (year, value, options) => year < options.min, { min: 5 });
 * const withinRange = trimSourceDataValues(data, (year, value, options) => value < options.min || value > options.max, { min: 1000, max: 5000 });
 */
export const trimSourceDataValues = (sourceData, trimFunction, options, addAuditEntry = null) => {
    if (!sourceData || typeof trimFunction !== 'function') {
        return sourceData;
    }

    // Handle single object vs array
    const isArray = Array.isArray(sourceData);
    const dataToProcess = isArray ? sourceData : [sourceData];

    if (dataToProcess.length === 0) {
        return sourceData;
    }

    // Detect data type using schema validation (single pass)
    const firstItem = dataToProcess[0];
    let dataType;

    try {
        CubeSourceDataSchema.validateSync(firstItem);
        dataType = 'CubeSourceData';
    } catch (error) {
        try {
            SimResultsSchema.validateSync(firstItem);
            dataType = 'SimResults';
        } catch (error2) {
            try {
                DataPointSchema.validateSync(firstItem);
                dataType = 'DataPoint';
            } catch (error3) {
                throw new Error('Invalid source data format for trimSourceDataValues');
            }
        }
    }

    // Process based on detected type
    let result;

    switch (dataType) {
        case 'CubeSourceData':
            result = dataToProcess.map(cubeSource => ({
                ...cubeSource,
                percentileSource: cubeSource.percentileSource.map(simResult => ({
                    ...simResult,
                    data: simResult.data.filter(dataPoint =>
                        !trimFunction(dataPoint.year, dataPoint.value, options)
                    )
                }))
            }));
            break;

        case 'SimResults':
            result = dataToProcess.map(simResult => ({
                ...simResult,
                data: simResult.data.filter(dataPoint =>
                    !trimFunction(dataPoint.year, dataPoint.value, options)
                )
            }));
            break;

        case 'DataPoint':
            result = dataToProcess.filter(dataPoint =>
                !trimFunction(dataPoint.year, dataPoint.value, options)
            );
            break;

        default:
            throw new Error('Unsupported data type for trimSourceDataValues');
    }

    // Add audit entry if function provided
    if (addAuditEntry) {
        addAuditEntry(
            'apply_trim',
            `trimmed data using (${trimFunction.toString()}) with options: ${JSON.stringify(options)}`,
            null,
            result,
            'transform',
            'trim'
        );
    }

    // Return in same format as input (array or single object)
    return isArray ? result : result[0];
};