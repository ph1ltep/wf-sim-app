// frontend/src/utils/cube/sources/transformers/common.js

import Yup from 'yup';
import { SimResultsSchema, DataPointSchema } from 'schemas/yup/distribution';
import { CubeSourceDataSchema } from 'schemas/yup/cube';

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
        cashflowGroup,
        category
    } = filters;

    // Early return if no filters
    if (!sourceId && !sourceIds && !metadataFilters && !type && !cashflowGroup && !category) {
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

        if (cashflowGroup && source.metadata.cashflowGroup !== cashflowGroup) {
            return false;
        }

        if (category && source.metadata.category !== category) {
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

    // Track dependencies for audit trail
    const dependencies = sources.map(source => source.id);

    // Add audit entry if function provided
    if (addAuditEntry) {
        addAuditEntry(
            'apply_aggregation',
            `aggregating ${sources.length} sources (${operation})`,
            dependencies
        );
    }

    // Determine effective percentiles
    const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
        ? [...availablePercentiles, 0]
        : availablePercentiles;

    // Create aggregation map: year-percentile -> value
    const aggregationMap = new Map();

    // Process each source
    sources.forEach(source => {
        if (!source.percentileSource || !Array.isArray(source.percentileSource)) {
            return;
        }

        source.percentileSource.forEach(simResult => {
            // ✅ FIXED: simResult is SimResultsSchema with .name, .data, .percentile
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
                        // ✅ FIXED: Iterate through customData.data array
                        customData.data.forEach(dataPoint => {
                            // Use the custom percentile data but maintain output percentile as 0
                            const key = `${dataPoint.year}-0`;
                            const currentValue = aggregationMap.get(key) || 0;

                            switch (operation) {
                                case 'sum':
                                    aggregationMap.set(key, currentValue + dataPoint.value);
                                    break;
                                case 'subtract':
                                    aggregationMap.set(key, currentValue - dataPoint.value);
                                    break;
                                case 'multiply':
                                    aggregationMap.set(key, currentValue === 0 ? dataPoint.value : currentValue * dataPoint.value);
                                    break;
                                default:
                                    aggregationMap.set(key, currentValue + dataPoint.value);
                            }
                        });
                        return; // Skip normal processing for this simResult
                    }
                }
                // If no custom percentile found, fall back to default (percentile 0)
            }

            // ✅ FIXED: Normal aggregation - iterate through simResult.data array
            simResult.data.forEach(dataPoint => {
                const key = `${dataPoint.year}-${targetPercentile}`;
                const currentValue = aggregationMap.get(key) || 0;

                switch (operation) {
                    case 'sum':
                        aggregationMap.set(key, currentValue + dataPoint.value);
                        break;
                    case 'subtract':
                        aggregationMap.set(key, currentValue - dataPoint.value);
                        break;
                    case 'multiply':
                        aggregationMap.set(key, currentValue === 0 ? dataPoint.value : currentValue * dataPoint.value);
                        break;
                    default:
                        aggregationMap.set(key, currentValue + dataPoint.value);
                }
            });
        });
    });

    // Convert back to SimResultsSchema array
    const result = [];
    aggregationMap.forEach((value, key) => {
        const [year, percentile] = key.split('-');
        result.push({
            year: parseInt(year, 10),
            value: value,
            percentile: { value: parseInt(percentile, 10) }
        });
    });

    // Sort by year then percentile for consistency
    result.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.percentile.value - b.percentile.value;
    });

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

    return data
        .filter(item => item.percentile && item.percentile.value === percentile)
        .map(item => ({
            year: item.year,
            value: item.value
        }))
        .sort((a, b) => a.year - b.year);
};

/**
 * Adjust values in source data using an inline transformation function
 * @param {Array|Object} sourceData - CubeSourceDataSchema array/object, SimResultsSchema array/object, or DataPointSchema array
 * @param {Function} adjustFunction - Function to transform each value: (percentile, year, value) => newValue
 * @returns {Array|Object} Transformed data in same format as input
 * ✅ Valid calls
 * const doubled = adjustSourceDataValues(data, (percentile, year, value) => value * 2);
 * const adjusted = adjustSourceDataValues(data, (percentile, year, value) => { return percentile > 50 ? value * 1.1 : value * 0.9; });
 */
export const adjustSourceDataValues = (sourceData, adjustFunction) => {
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
                percentileSource: cubeSource.percentileSource.map(item => ({
                    ...item,
                    value: adjustFunction(item.percentile.value, item.year, item.value)
                }))
            }));
            break;

        case 'SimResults':
            result = dataToProcess.map(item => ({
                ...item,
                value: adjustFunction(item.percentile.value, item.year, item.value)
            }));
            break;

        case 'DataPoint':
            result = dataToProcess.map(item => ({
                ...item,
                value: adjustFunction(50, item.year, item.value) // Default percentile for DataPoint
            }));
            break;

        default:
            throw new Error('Unsupported data type for adjustSourceDataValues');
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
export const normalizeIntoSimResults = (dataPoints, availablePercentiles, name, customPercentile = null) => {
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

    return result;
};