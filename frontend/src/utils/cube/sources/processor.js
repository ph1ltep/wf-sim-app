// frontend/src/utils/cube/processor.js
import { CubeSourceDataSchema } from 'schemas/yup/cube';
import { SimResultsSchema, DataPointSchema, SimulationInfoSchema } from 'schemas/yup/distribution';
import { createAuditTrail } from '../audit';

const Yup = require('yup');

/**
 * Process source registry data following PHASE 1 cube processing flow
 * @param {Object} sourceRegistry - CubeSourceRegistrySchema with references and sources
 * @param {Array} percentileInfo - percentileData object containing available percentiles and custom percentiles
 * @param {Function} getValueByPath - Function to extract data from scenario: (path: string[]) => any
 * @param {Object|null} customPercentile - Custom percentile configuration {sourceId: percentileValue} or null
 * @returns {Array} Array of CubeSourceDataSchema objects (processedData)
 */
export const computeSourceData = (sourceRegistry, percentileInfo, getValueByPath) => {
    console.log('🔄 Starting PHASE 1 cube data processing...');
    const availablePercentiles = percentileInfo.available;
    const useCustomPercentile = percentileInfo.strategy === 'unified' ? false : true;
    const startTime = performance.now();

    // Modify availablePercentiles if customPercentile is enabled
    const effectivePercentiles = useCustomPercentile
        ? [...availablePercentiles, 0]
        : availablePercentiles;

    // Step 1: Load global references
    const globalReferences = {};
    let referenceErrors = 0;

    sourceRegistry.references.forEach(ref => {
        try {
            const refValue = getValueByPath(ref.path);
            globalReferences[ref.id] = refValue;
        } catch (error) {
            console.error(`❌ Failed to load global reference '${ref.id}':`, error.message);
            referenceErrors++;
        }
    });

    console.log(`📚 Global references loaded: ${Object.keys(globalReferences).length}, errors: ${referenceErrors}`);

    // Step 2: Initialize processedData
    const processedData = [];

    // Step 3: Process sources by priority (direct, indirect, virtual)
    const sortedSources = [...sourceRegistry.sources].sort((a, b) => {
        const priorityOrder = { 'direct': 1, 'indirect': 2, 'virtual': 3 };
        const typePriority = priorityOrder[a.metadata.type] - priorityOrder[b.metadata.type];
        return typePriority !== 0 ? typePriority : a.priority - b.priority;
    });

    let processedCount = 0;
    let errorCount = 0;

    for (const source of sortedSources) {
        try {
            // Initialize audit trail for this source
            const auditTrail = createAuditTrail(source.id, 50, true);
            const { getTrail, getReferences } = auditTrail;

            // Step 3a: Validate source type
            if (!validateSourceType(source)) {
                console.error(`❌ Invalid source type configuration for '${source.id}'`);
                errorCount++;
                continue;
            }

            // Step 3b: Load local references
            const localReferences = {};
            source.references.forEach(ref => {
                try {
                    const refValue = getValueByPath(ref.path);
                    localReferences[ref.id] = refValue;
                } catch (error) {
                    console.error(`❌ Failed to load local reference '${ref.id}' for source '${source.id}':`, error.message);
                }
            });

            // Step 3c: Combine global + local references (local overrides global)
            const allReferences = { ...globalReferences, ...localReferences };

            // Add audit entry for reference loading
            // auditTrail.addAuditEntry(
            //     'apply_reference_loading',
            //     `loaded ${Object.keys(allReferences).length} references`,
            //     Object.keys(allReferences)
            // );

            // Step 3d: Extract source data
            let sourceData = null;
            if (source.path) {
                try {
                    sourceData = getValueByPath(source.path);
                    //sourceData = sourceData.results;

                    // Handle custom percentile for sources with percentiles
                    if (useCustomPercentile && source.hasPercentiles && sourceData) {
                        sourceData = addCustomPercentileData(sourceData, source.id, percentileInfo.custom);
                    }

                    console.log(`📥 Source data extracted for '${source.id}'`);

                    // Add audit entry for processing start with input data sample
                    auditTrail.addAuditEntry(
                        'apply_processing_start',
                        `extracted data from path: ${source.path.join('.')}`,
                        [], // No dependencies here
                        sourceData // Single data sample
                    );

                } catch (error) {
                    console.error(`❌ Failed to extract source data for '${source.id}':`, error.message);
                    errorCount++;
                    continue;
                }
            }

            // Step 3e: Apply transformer
            let transformedData;
            if (source.transformer) {
                try {
                    transformedData = applyTransformer(sourceData, source, percentileInfo, allReferences, processedData, percentileInfo.custom, auditTrail.addAuditEntry);
                    console.log(`🔄 Transformer applied to '${source.id}'`);
                } catch (error) {
                    console.error(`❌ Transformer failed for '${source.id}':`, error.message);
                    errorCount++;
                    continue;
                }
            } else {
                // Convert sourceData to SimResultsSchema array if no transformer
                transformedData = validateSourceDataStructure(sourceData, source.hasPercentiles, effectivePercentiles);
            }

            // Step 3f: Apply multipliers
            let multipliedData;
            if (source.multipliers && source.multipliers.length > 0) {
                try {
                    multipliedData = applyMultipliers(transformedData, source.multipliers, allReferences, processedData, percentileInfo.custom, auditTrail.addAuditEntry);
                    console.log(`🔢 ${source.multipliers.length} multipliers applied to '${source.id}'`);
                } catch (error) {
                    console.error(`❌ Multipliers failed for '${source.id}':`, error.message);
                    errorCount++;
                    continue;
                }
            } else {
                multipliedData = transformedData;
            }

            // Add audit entry for processing end with final output sample
            auditTrail.addAuditEntry(
                'apply_processing_end',
                `processing complete`,
                [], // No dependencies here
                multipliedData // Single data sample of final result
            );
            // Step 3g: Build CubeSourceDataSchema
            const trail = getTrail();
            const cubeSourceData = {
                id: source.id,
                percentileSource: multipliedData,
                metadata: source.metadata,
                audit: {
                    trail: trail,
                    references: getReferences(trail, allReferences)
                }
            };

            // Ultra-fast validation
            if (!cubeSourceData.id || !Array.isArray(cubeSourceData.percentileSource) || !cubeSourceData.metadata) {
                console.error(`❌ Invalid CubeSourceDataSchema for '${source.id}'`);
                errorCount++;
                continue;
            }

            // Add to processedData
            processedData.push(cubeSourceData);
            processedCount++;
            console.log(`✅ Source '${source.id}' processed successfully`);

        } catch (error) {
            console.error(`❌ Unexpected error processing source '${source.id}':`, error.message, source);
            errorCount++;
        }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.log(`🎉 PHASE 1 processing complete: ${processedCount} sources processed, ${errorCount} errors, ${referenceErrors} reference errors`);
    console.log(`⏱️ Total processing time: ${duration}ms`);

    return processedData;
};

/**
 * Validate source type against requirements
 * @param {Object} source - Source object to validate
 * @returns {boolean} True if valid
 */
const validateSourceType = (source) => {
    const { type } = source.metadata;

    switch (type) {
        case 'direct':
            return source.path && (!source.multipliers || source.multipliers.length === 0);
        case 'indirect':
            return source.path && source.multipliers;
        case 'virtual':
            return !source.path && source.transformer;
        default:
            return false;
    }
};

/**
 * Add custom percentile data by copying from specified percentile
 * @param {Array} sourceData - Original source data array
 * @param {string} sourceId - Source ID to lookup in customPercentile
 * @param {Object} customPercentile - Custom percentile configuration
 * @returns {Array} Source data with added custom percentile (0) entry
 */
const addCustomPercentileData = (sourceData, sourceId, customPercentile) => {
    if (!Array.isArray(sourceData) || customPercentile == {}) return sourceData;

    const targetPercentile = customPercentile[sourceId];
    if (!targetPercentile) return sourceData;

    // Find the item with the target percentile value
    const sourceItem = sourceData.find(item =>
        item.percentile && item.percentile.value === targetPercentile
    );

    if (!sourceItem) {
        console.warn(`⚠️ Custom percentile ${targetPercentile} not found for source '${sourceId}'`);
        return sourceData;
    }

    // Create a copy with percentile 0 but metadata showing original percentile
    const customItem = {
        ...sourceItem,
        percentile: { value: 0 },
        metadata: {
            ...sourceItem.metadata,
            customPercentile: targetPercentile
        }
    };

    return [...sourceData, customItem];
};

/**
 * Validate and normalize source data to SimResultsSchema array
 * @param {any} sourceData - Raw source data
 * @param {boolean} hasPercentiles - Whether source has percentile data
 * @param {Array} availablePercentiles - Available percentiles [10, 25, 50, 75, 90]
 * @returns {Array} Array of SimResultsSchema objects
 * 
 * Acceptable input types:
 * - Single SimResultsSchema object
 * - Array of DataPointSchema objects
 * - Array of SimResultsSchema objects (returns as-is if valid)
 */
const validateSourceDataStructure = (sourceData, hasPercentiles, availablePercentiles) => {
    if (!sourceData) return [];

    // Check if already compliant SimResultsSchema array
    if (Array.isArray(sourceData)) {
        try {
            // Direct Yup validation for SimResultsSchema array
            Yup.array().of(SimResultsSchema).validateSync(sourceData);
            return sourceData;
        } catch (error) {
            try {
                // Try DataPointSchema array validation
                Yup.array().of(DataPointSchema).validateSync(sourceData);

                // Convert DataPointSchema array to SimResultsSchema array
                return sourceData.flatMap(dataPoint =>
                    availablePercentiles.map(percentile => ({
                        year: dataPoint.year,
                        value: dataPoint.value,
                        percentile: { value: percentile }
                    }))
                );
            } catch (error2) {
                throw new Error(`Invalid source data array format: ${error2.message}`);
            }
        }
    }

    // Handle single SimResultsSchema object
    try {
        SimResultsSchema.validateSync(sourceData);
        // Expand to all percentiles
        return availablePercentiles.map(percentile => ({
            year: sourceData.year,
            value: sourceData.value,
            percentile: { value: percentile }
        }));
    } catch (error) {
        throw new Error(`Invalid source data format - must be SimResultsSchema object or DataPointSchema array: ${error.message}`);
    }
};

/**
 * Apply transformer to source data
 * @param {any} sourceData - Raw source data
 * @param {Object} source - Source configuration
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Object} allReferences - Combined references
 * @param {Array} processedData - Previously processed data
 * @param {Object|null} customPercentile - Custom percentile configuration
 * @returns {Array} Array of SimResultsSchema objects
 */
const applyTransformer = (sourceData, source, percentileInfo, allReferences, processedData, customPercentile, addAuditEntry) => {
    const context = {
        availablePercentiles: percentileInfo.available,
        percentileInfo,
        allReferences,
        processedData,
        hasPercentiles: source.hasPercentiles,
        metadata: source.metadata,
        customPercentile, // This is the custom percentile for this particular source.
        addAuditEntry // Pass audit function to transformer
    };

    // Transformer will handle its own audit entries with dependencies
    const transformerResult = source.transformer(sourceData, context);

    // Validate and normalize transformer output
    return validateSourceDataStructure(transformerResult, source.hasPercentiles, percentileInfo.available);
};

/**
 * Apply multipliers to transformed data
 * @param {Array} transformedData - Array of SimResultsSchema objects
 * @param {Array} multipliers - Array of multiplier configurations
 * @param {Object} allReferences - Combined references
 * @param {Array} processedData - Previously processed data
 * @param {Object|null} customPercentile - Custom percentile configuration
 * @returns {Object} { data: Array<SimResultsSchema>, appliedMultipliers: Array<AppliedMultiplierSchema> }
 */
const applyMultipliers = (transformedData, multipliers, allReferences, processedData, customPercentile, addAuditEntry) => {
    let resultData = [...transformedData];

    // Process each multiplier in array order
    multipliers.forEach(multiplier => {
        const multiplierValues = findMultiplierValues(multiplier.id, processedData, allReferences);

        if (multiplierValues) {

            // Create optimized value lookup function
            const getMultiplierValue = createValueLookup(multiplierValues, customPercentile, multiplier.id);

            resultData = resultData.map(simResult => ({
                ...simResult,
                data: simResult.data.map(dataPoint => {
                    // Apply filter if exists - filter operates on source data (year, value, percentile)
                    if (multiplier.filter && !multiplier.filter(dataPoint.year, dataPoint.value, simResult.percentile.value)) {
                        return dataPoint;
                    }

                    // Get multiplier value for this data point
                    const multiplierValue = getMultiplierValue(dataPoint.year, simResult.percentile.value);
                    if (multiplierValue === null) return dataPoint;

                    let newValue;
                    const baseYear = multiplier.baseYear || 1;

                    switch (multiplier.operation) {
                        case 'multiply':
                            newValue = dataPoint.value * multiplierValue;
                            break;
                        case 'compound':
                            newValue = dataPoint.value * Math.pow(1 + multiplierValue, dataPoint.year - baseYear);
                            break;
                        case 'simple':
                            newValue = dataPoint.value * (1 + multiplierValue * (dataPoint.year - baseYear));
                            break;
                        case 'summation':
                            newValue = dataPoint.value + multiplierValue;
                            break;
                        default:
                            throw new Error(`Unknown multiplier operation: ${multiplier.operation}`);
                    }

                    return {
                        ...dataPoint,
                        value: newValue
                    };
                })
            }));

            // Determine multiplier value type for audit
            const valueType = typeof multiplierValues === 'number' ? 'scalar' :
                Array.isArray(multiplierValues) ? 'timeSeries' : 'processed';

            // Add audit entry for multiplier with actual dependency and sample data
            addAuditEntry(
                'apply_multiplier',
                `${multiplier.id} (${multiplier.operation}, ${valueType})`,
                [multiplier.id], // This is the actual dependency - the multiplier source
                multiplierValues, // Single sample of the multiplier data
                'multiply', // Type of operation
                multiplier.operation // Type of operation for audit
            );


        }
    });

    return resultData;
};

/**
 * Create optimized value lookup function based on multiplier format
 * @param {any} multiplierValues - Scalar, DataPointSchema array, or SimResultsSchema array
 * @param {Object|null} customPercentile - Custom percentile configuration
 * @param {string} multiplierId - Multiplier ID for custom percentile lookup
 * @returns {Function} (year, percentile) => multiplier value or null
 */
const createValueLookup = (multiplierValues, customPercentile, multiplierId) => {
    // Direct Yup validation for type checking
    if (typeof multiplierValues === 'number') {
        return (year, percentile) => multiplierValues;
    }

    if (Array.isArray(multiplierValues)) {
        try {
            // Check if SimResultsSchema array
            Yup.array().of(SimResultsSchema).validateSync(multiplierValues);
            const lookupMap = new Map();

            // ✅ FIXED: Handle SimResultsSchema structure properly
            multiplierValues.forEach(simResult => {
                // Iterate through the .data array within each SimResultsSchema
                simResult.data.forEach(dataPoint => {
                    const key = `${dataPoint.year}-${simResult.percentile.value}`;
                    lookupMap.set(key, dataPoint.value);
                });
            });

            return (year, percentile) => {
                // Handle custom percentile (0) lookup
                let actualPercentile = percentile;
                if (percentile === 0 && customPercentile && customPercentile[multiplierId]) {
                    actualPercentile = customPercentile[multiplierId];
                }

                const key = `${year}-${actualPercentile}`;
                return lookupMap.get(key) || null;
            };
        } catch (error) {
            try {
                // Check if DataPointSchema array - this part is correct
                Yup.array().of(DataPointSchema).validateSync(multiplierValues);
                const lookupMap = new Map();
                multiplierValues.forEach(dataPoint => {
                    lookupMap.set(dataPoint.year, dataPoint.value);
                });

                return (year, percentile) => lookupMap.get(year) || null;
            } catch (error2) {
                throw new Error(`Invalid multiplier values format: ${error2.message}`);
            }
        }
    }

    throw new Error('Multiplier values must be scalar, DataPointSchema array, or SimResultsSchema array');
};

/**
 * Find multiplier values in processed data or references
 * @param {string} multiplierId - Multiplier ID to find
 * @param {Array} processedData - Previously processed data
 * @param {Object} allReferences - Combined references
 * @returns {Array|null} Multiplier values or null if not found
 */
const findMultiplierValues = (multiplierId, processedData, allReferences) => {
    // Look in processedData first
    const processedSource = processedData.find(item => item.id === multiplierId);
    if (processedSource) {
        return processedSource.percentileSource;
    }

    // Look in allReferences second
    if (allReferences[multiplierId]) {
        return allReferences[multiplierId];
    }

    return null;
};