// frontend/src/utils/cube/processor.js
import { CubeSourceDataSchema } from '../../../schemas/yup/cube';

/**
 * Process source registry data following PHASE 1 cube processing flow
 * @param {Object} sourceRegistry - CubeSourceRegistrySchema with references and sources
 * @param {Array} availablePercentiles - Array of available percentiles [10, 25, 50, 75, 90]
 * @param {Function} getValueByPath - Function to extract data from scenario: (path: string[]) => any
 * @returns {Array} Array of CubeSourceDataSchema objects (processedData)
 */
export const computeSourceData = (sourceRegistry, availablePercentiles, getValueByPath) => {
    console.log('🔄 Starting PHASE 1 cube data processing...');
    const startTime = performance.now();
    
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
    
    // Step 3: Sort sources by priority and type
    console.log('🔀 Sorting sources by priority and type...');
    const sortedSources = [...sourceRegistry.sources]
        .sort((a, b) => {
            // Sort by priority first, then by type order (direct -> indirect -> virtual)
            if (a.priority !== b.priority) return a.priority - b.priority;
            
            const typeOrder = { direct: 1, indirect: 2, virtual: 3 };
            return typeOrder[a.metadata.type] - typeOrder[b.metadata.type];
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
                    transformedData = applyTransformer(sourceData, source, availablePercentiles, allReferences, processedData);
                    console.log(`🔄 Transformer applied to '${source.id}'`);
                } catch (error) {
                    console.error(`❌ Transformer failed for '${source.id}':`, error.message);
                    errorCount++;
                    continue;
                }
            } else {
                // Convert sourceData to SimResultsSchema array if no transformer
                transformedData = convertToSimResultsSchema(sourceData, source.hasPercentiles, availablePercentiles);
            }
            
            // Step 3f: Apply multipliers
            let multipliedData;
            let appliedMultipliers = [];
            
            if (source.multipliers && source.multipliers.length > 0) {
                try {
                    const multiplierResult = applyMultipliers(transformedData, source.multipliers, allReferences, processedData);
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
 * Convert raw source data to SimResultsSchema array
 * @param {any} sourceData - Raw source data
 * @param {boolean} hasPercentiles - Whether source has percentile data
 * @param {Array} availablePercentiles - Available percentiles
 * @returns {Array} Array of SimResultsSchema objects
 */
const convertToSimResultsSchema = (sourceData, hasPercentiles, availablePercentiles) => {
    // Placeholder implementation
    // TODO: Implement conversion logic based on data type and percentile requirements
    if (!sourceData) return [];
    
    // If already an array, assume it's correctly formatted
    if (Array.isArray(sourceData)) return sourceData;
    
    // If scalar value, convert to array with default structure
    return [{
        year: 1,
        value: sourceData,
        percentile: { value: 50 } // Default to median
    }];
};

/**
 * Apply transformer to source data
 * @param {any} sourceData - Raw source data
 * @param {Object} source - Source configuration
 * @param {Array} availablePercentiles - Available percentiles
 * @param {Object} allReferences - Combined references
 * @param {Array} processedData - Previously processed data
 * @returns {Array} Array of SimResultsSchema objects
 */
const applyTransformer = (sourceData, source, availablePercentiles, allReferences, processedData) => {
    // Placeholder for transformer application
    // TODO: Implement transformer calling logic
    const context = {
        hasPercentiles: source.hasPercentiles,
        availablePercentiles,
        allReferences,
        processedData,
        options: {} // Can be extended later
    };
    
    return source.transformer(sourceData, context);
};

/**
 * Apply multipliers to transformed data
 * @param {Array} transformedData - Array of SimResultsSchema objects
 * @param {Array} multipliers - Array of multiplier configurations
 * @param {Object} allReferences - Combined references
 * @param {Array} processedData - Previously processed data
 * @returns {Object} { data: Array, appliedMultipliers: Array }
 */
const applyMultipliers = (transformedData, multipliers, allReferences, processedData) => {
    // Placeholder for multiplier application
    // TODO: Implement multiplier operations (multiply, compound, simple, summation)
    
    const appliedMultipliers = [];
    let resultData = [...transformedData];
    
    // Process each multiplier in array order
    multipliers.forEach(multiplier => {
        // Look for multiplier values in processedData first, then allReferences
        let multiplierValues = findMultiplierValues(multiplier.id, processedData, allReferences);
        
        if (multiplierValues) {
            // Apply multiplier operation
            // TODO: Implement actual multiplier operations
            
            appliedMultipliers.push({
                id: multiplier.id,
                operation: multiplier.operation,
                values: multiplierValues,
                baseYear: multiplier.baseYear || 1,
                cumulative: false
            });
        }
    });
    
    return {
        data: resultData,
        appliedMultipliers
    };
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