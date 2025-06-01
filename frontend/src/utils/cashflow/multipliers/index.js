// src/utils/cashflow/multipliers/index.js - Simplified multiplier application
import { MULTIPLIER_OPERATIONS } from './operations';

/**
 * Apply multipliers to data - simplified version
 * @param {Array} baseData - Base data points
 * @param {Array} multiplierConfigs - Multiplier configurations  
 * @param {Object} multiplierData - Map of multiplier ID to data arrays
 * @returns {Object} {data: transformedData, appliedMultipliers: metadata}
 */
export const applyMultipliers = (baseData, multiplierConfigs, multiplierData) => {
    if (!baseData || !Array.isArray(baseData)) {
        return { data: [], appliedMultipliers: [] };
    }

    if (!multiplierConfigs || multiplierConfigs.length === 0) {
        return { data: baseData, appliedMultipliers: [] };
    }

    let transformedData = [...baseData];
    const appliedMultipliers = [];

    // Apply each multiplier in sequence
    multiplierConfigs.forEach(config => {
        const multiplierValues = multiplierData[config.id];
        if (!multiplierValues || !Array.isArray(multiplierValues)) {
            console.warn(`No multiplier data for '${config.id}'`);
            return;
        }

        // Apply operation to each data point
        transformedData = transformedData.map(dataPoint => {
            const multiplierPoint = multiplierValues.find(m => m.year === dataPoint.year);
            if (!multiplierPoint) return dataPoint;

            const operation = MULTIPLIER_OPERATIONS[config.operation];
            if (!operation) return dataPoint;

            let newValue;
            if (config.operation === 'multiply') {
                newValue = operation(dataPoint.value, multiplierPoint.value);
            } else {
                newValue = operation(dataPoint.value, multiplierPoint.value, dataPoint.year, config.baseYear);
            }

            return { ...dataPoint, value: newValue };
        });

        // Track metadata
        appliedMultipliers.push({
            id: config.id,
            operation: config.operation,
            values: multiplierValues,
            baseYear: config.baseYear || 1,
            cumulative: config.cumulative || false
        });
    });

    return { data: transformedData, appliedMultipliers };
};

export { MULTIPLIER_OPERATIONS };