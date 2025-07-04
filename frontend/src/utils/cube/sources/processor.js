// frontend/src/utils/cube/processor.js
import { CubeSourceDataSchema } from '../../../schemas/yup/cube';
import { SimResultsSchema, DataPointSchema } from '../../../schemas/yup/distribution';
import { validate } from '../validate';
import Yup from 'yup';

/**
 * Process source registry data following PHASE 1 cube processing flow
 * @param {Object} sourceRegistry - CubeSourceRegistrySchema with references and sources
 * @param {Array} availablePercentiles - Array of available percentiles [10, 25, 50, 75, 90]
 * @param {Function} getValueByPath - Function to extract data from scenario: (path: string[]) => any
 * @param {Object|null} customPercentile - Custom percentile configuration {sourceId: percentileValue} or null
 * @returns {Array} Array of CubeSourceDataSchema objects (processedData)
 */
export const computeSourceData = (sourceRegistry, availablePercentiles, getValueByPath, customPercentile = null) => {
    console.log('🔄 Starting PHASE 1 cube data processing...');
    const startTime = performance.now();
    
    // Modify availablePercentiles if customPercentile is enabled
    const effectivePercentiles = customPercentile 
        ? [...availablePercentiles, 0]
        : availablePercentiles;
    
    // Step 1: Load global references
    console.log('📚 Loading global references...');
    const globalReferences = {};
    let referenceErrors = 0;
    
    sourceRegistry.references?.forEach(ref => {
        try {
            const value = getValueByPath(ref.path);
            globalReferences[ref.id] = value;
            console.log(`✅ Global reference '${ref.id}' loaded`);
        } catch (error) {
            console.error(`❌ Failed to load global reference '${ref.id}':`, error.message);
            referenceErrors++;
        }
    });
    
    // Step 2: Initialize processedData array
    const processedData = [];
    
    // Step 3: Sort sources by type and priority
    console.log('🔀 Sorting sources by type and priority...');
    const sortedSources = [...sourceRegistry.sources]
        .sort((a, b) => {
            // Sort by type first (direct -> indirect -> virtual)
            const typeOrder = { direct: 1, indirect: 2, virtual: 3 };
            if (a.metadata.type !== b.metadata.type) {
                return typeOrder[a.metadata.type] - typeOrder[b.metadata.type];
            }
            
            // Then by priority within type grouping
            return a.priority - b.priority;
        });
    
    console.log(`📊 Processing ${sortedSources.length} sources in priority order...`);
    
    // Main processing loop
    let processedCount = 0;
    let errorCount = 0;
    
    for (const source of sortedSources) {
        try {
            console.log(`🔍 Processing source '${source.id}' (${source.metadata.type}, priority: ${source.priority})`);
            
            // Step 3a: Validate source type
            const isValidSource = validateSourceType(source);
            if (!isValidSource) {
                console.error(`❌ Source '${source.id}' failed validation`);
                errorCount++;
                continue;
            }
            
            // Step 3b: Process local references
            const localReferences = {};
            source.references?.forEach(ref => {
                try {
                    const value = getValueByPath(ref.path);
                    localReferences[ref.id] = value;
                } catch (error) {
                    console.error(`❌ Failed to load local reference '${ref.id}' for source '${source.id}':`, error.message);
                }
            });
            
            // Step 3c: Combine global + local references (local overrides global)
            const allReferences = { ...globalReferences, ...localReferences };
            
            // Step 3d: Extract source data
            let sourceData = null;
            if (source.path) {
                try {
                    sourceData = getValueByPath(source.path);
                    
                    // Handle custom percentile for sources with percentiles
                    if (customPercentile && source.hasPercentiles && sourceData) {
                        sourceData = addCustomPercentileData(sourceData, source.id, customPercentile);
                    }
                    
                    console.log(`📥 Source data extracted for '${source.id}'`);
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
                    transformedData = applyTransformer(sourceData, source, effectivePercentiles, allReferences, processedData, customPercentile);
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
            let appliedMultipliers = [];
            
            if (source.multipliers && source.multipliers.length > 0) {
                try {
                    const multiplierResult = applyMultipliers(transformedData, source.multipliers, allReferences, processedData, customPercentile);
                    multipliedData = multiplierResult.data;
                    appliedMultipliers = multiplierResult.appliedMultipliers;
                    console.log(`🔢 ${source.multipliers.length} multipliers applied to '${source.id}'`);
                } catch (error) {
                    console.error(`❌ Multipliers failed for '${source.id}':`, error.message);
                    errorCount++;
                    continue;
                }
            } else {
                multipliedData = transformedData;
            }
            
            // Step 3g: Build CubeSourceDataSchema
            const cubeSourceData = {
                id: source.id,
                percentileSource: multipliedData,
                metadata: source.metadata,
                audit: {
                    appliedMultipliers
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
            console.error(`❌ Unexpected error processing source '${source.id}':`, error.message);
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
    if (!Array.isArray(sourceData)) return sourceData;
    
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
const applyTransformer = (sourceData, source, availablePercentiles, allReferences, processedData, customPercentile) => {
    const context = {
        hasPercentiles: source.hasPercentiles,
        availablePercentiles,
        allReferences,
        processedData,
        options: {},
        id: source.id,
        metadata: source.metadata,
        customPercentile
    };
    
    const transformerResult = source.transformer(sourceData, context);
    
    // Validate and normalize transformer output
    return validateSourceDataStructure(transformerResult, source.hasPercentiles, availablePercentiles);
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
const applyMultipliers = (transformedData, multipliers, allReferences, processedData, customPercentile) => {
    const appliedMultipliers = [];
    let resultData = [...transformedData];
    
    // Process each multiplier in array order
    multipliers.forEach(multiplier => {
        const multiplierValues = findMultiplierValues(multiplier.id, processedData, allReferences);
        
        if (multiplierValues) {
            // Create optimized value lookup function
            const getMultiplierValue = createValueLookup(multiplierValues, customPercentile, multiplier.id);
            
            // Apply multiplier operation
            resultData = resultData.map(dataPoint => {
                // Apply filter if exists - filter operates on source data (year, value, percentile)
                if (multiplier.filter && !multiplier.filter(dataPoint.year, dataPoint.value, dataPoint.percentile.value)) {
                    return dataPoint;
                }
                
                // Get multiplier value for this data point
                const multiplierValue = getMultiplierValue(dataPoint.year, dataPoint.percentile.value);
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
            });
            
            // Determine actual percentile for audit trail
            let auditPercentile = null;
            if (customPercentile && customPercentile[multiplier.id]) {
                auditPercentile = customPercentile[multiplier.id];
            }
            
            appliedMultipliers.push({
                id: multiplier.id,
                operation: multiplier.operation,
                values: multiplierValues,
                baseYear: multiplier.baseYear || 1,
                cumulative: false,
                actualPercentile: auditPercentile // Log actual percentile used for custom percentile
            });
        }
    });
    
    return {
        data: resultData,
        appliedMultipliers
    };
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
            multiplierValues.forEach(item => {
                const key = `${item.year}-${item.percentile.value}`;
                lookupMap.set(key, item.value);
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
                // Check if DataPointSchema array
                Yup.array().of(DataPointSchema).validateSync(multiplierValues);
                const lookupMap = new Map();
                multiplierValues.forEach(item => {
                    lookupMap.set(item.year, item.value);
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