// frontend/src/utils/cube/audit.js
import { DataPointSchema, SimResultsSchema } from 'schemas/yup/distribution';

/**
 * Extract data sample for audit trail
 * @param {any} sourceData - Input data to sample
 * @param {number} preferredPercentile - Preferred percentile for sampling
 * @returns {any} Sampled data or null if extraction fails
 */
const extractDataSample = (sourceData, preferredPercentile) => {
    try {
        // Handle null/undefined
        if (!sourceData) return null;

        // Handle scalar values
        if (typeof sourceData === 'number' || typeof sourceData === 'string') {
            return sourceData;
        }

        // Handle non-array objects
        if (!Array.isArray(sourceData)) {
            return sourceData;
        }

        // Handle empty arrays
        if (sourceData.length === 0) return null;

        // Check if it's SimResultsSchema array (has percentile.value)
        if (sourceData[0] && sourceData[0].percentile && typeof sourceData[0].percentile.value === 'number') {
            // Filter by preferred percentile
            const filteredData = sourceData.filter(item => item.percentile.value === preferredPercentile);

            // Return filtered data or fallback to first item
            return filteredData.length > 0 ? filteredData : [sourceData[0]];
        }

        // Check if it's DataPointSchema array (has year and value)
        if (sourceData[0] && typeof sourceData[0].year === 'number' && typeof sourceData[0].value === 'number') {
            // Return full DataPointSchema array
            return sourceData;
        }

        // For other arrays, return first item
        return sourceData[0];

    } catch (error) {
        console.error('Failed to extract data sample:', error);
        return null;
    }
};

/**
 * Calculate step durations for audit trail
 * @param {Array} trail - Array of audit trail entries
 * @returns {Array} Updated trail with duration calculations
 */
const calcStepDurations = (trail) => {
    if (!trail || trail.length === 0) return trail;

    // Group entries by step name
    const stepGroups = {};
    trail.forEach((entry, index) => {
        if (!stepGroups[entry.step]) {
            stepGroups[entry.step] = [];
        }
        stepGroups[entry.step].push({ ...entry, originalIndex: index });
    });

    // Calculate durations for each step group
    const updatedTrail = [...trail];

    Object.entries(stepGroups).forEach(([stepName, entries]) => {
        if (entries.length > 1) {
            // Multiple entries - calculate duration between first and last
            const firstEntry = entries[0];
            const lastEntry = entries[entries.length - 1];
            const duration = lastEntry.timestamp - firstEntry.timestamp;

            // Update all entries of this step with the calculated duration
            entries.forEach(entry => {
                updatedTrail[entry.originalIndex].duration = duration;
            });
        } else {
            // Single entry - duration is 0
            updatedTrail[entries[0].originalIndex].duration = 0;
        }
    });

    return updatedTrail;
};

/**
 * Create audit trail factory for a source
 * @param {string} sourceId - Source ID being processed
 * @param {number} preferredPercentile - Preferred percentile for data sampling (default: 50)
 * @param {boolean} dataSamplingEnabled - Whether to include data samples (default: true)
 * @returns {Object} Audit trail functions
 */
export const createAuditTrail = (sourceId, preferredPercentile = 50, dataSamplingEnabled = true) => {
    const trail = [];

    /**
     * Add audit trail entry
     * @param {string} step - Step name/description
     * @param {string|null} details - Additional details
     * @param {string|Array} dependencies - Dependencies (single string or array)
     * @param {any} sourceData - Optional source data for sampling
     */
    const addAuditEntry = (step, details = null, dependencies = [], sourceData = null, type = 'none', typeOperation = 'none') => {
        const entry = {
            timestamp: Date.now(),
            step,
            details,
            dependencies: Array.isArray(dependencies) ? dependencies : [dependencies].filter(Boolean),
            type: type,
            typeOperation: typeOperation,
        };

        // Add data sample if enabled and data provided
        if (dataSamplingEnabled && sourceData !== null) {
            const dataSample = extractDataSample(sourceData, preferredPercentile);
            if (dataSample !== null) {
                entry.dataSample = {
                    percentile: preferredPercentile,
                    data: dataSample
                };
            }
        }

        trail.push(entry);
    };

    /**
     * Get audit trail with calculated durations
     * @returns {Array} Complete audit trail with durations
     */
    const getTrail = () => {
        return calcStepDurations(trail);
    };

    /**
     * Extract and resolve all unique references used in an audit trail
     * @param {Array} trail - Array of AuditTrailEntrySchema objects
     * @param {Object} referenceData - Reference data in allReferences format {refId: value, ...}
     * @returns {Object} Object with reference IDs as keys and their values
     */
    const getReferences = (trail, referenceData) => {
        if (!Array.isArray(trail) || trail.length === 0) {
            console.warn('⚠️ getReferences: trail must be a non-empty array');
            return {};
        }

        if (!referenceData || typeof referenceData !== 'object') {
            console.warn('⚠️ getReferences: referenceData must be an object');
            return {};
        }

        // Extract all dependencies from trail entries
        const allDependencies = new Set();

        trail.forEach(entry => {
            if (entry.dependencies && Array.isArray(entry.dependencies)) {
                entry.dependencies.forEach(dep => {
                    if (typeof dep === 'string' && dep.trim()) {
                        allDependencies.add(dep);
                    }
                });
            }
        });

        // Cross-reference with referenceData to get values
        const resolvedReferences = {};

        allDependencies.forEach(refId => {
            if (referenceData.hasOwnProperty(refId)) {
                resolvedReferences[refId] = referenceData[refId];
            }
            // Silently skip dependencies that are not references
        });

        return resolvedReferences;
    };

    return {
        addAuditEntry,
        getTrail,
        getReferences
    };
};