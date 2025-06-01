// src/components/tables/inline/DataOperations.js

/**
 * Check if the data at path is a single object (not an array)
 */
export const isSingleObjectMode = (data) => {
    return data && typeof data === 'object' && !Array.isArray(data);
};

/**
 * Normalize time series data for editing
 */
export const normalizeTimeSeriesData = (contracts, selectedField, fieldConfig, yearColumns) => {
    if (!contracts || !Array.isArray(contracts)) return [];

    return contracts.map(contract => {
        const timeSeries = contract[selectedField] || [];
        const defaultValue = fieldConfig?.defaultValueField ?
            (contract[fieldConfig.defaultValueField] || 0) : 0;
        const normalizedSeries = [];

        yearColumns.forEach(year => {
            const existing = timeSeries.find(dp => dp.year === year);
            normalizedSeries.push(existing || {
                year,
                value: defaultValue
            });
        });

        return { ...contract, [selectedField]: normalizedSeries };
    });
};

/**
 * Trim blank entries and specific values from time series
 * @param {Array} contracts - Array of contract objects
 * @param {string} selectedField - Field name to trim
 * @param {boolean} trimBlanks - Whether to remove null/empty values
 * @param {any} trimValue - Specific value to remove (e.g., 0 for percentages)
 * @returns {Array} Processed contracts
 */
export const trimTimeSeriesData = (contracts, selectedField, trimBlanks = true, trimValue = null) => {
    return contracts.map(contract => ({
        ...contract,
        [selectedField]: (contract[selectedField] || []).filter(dp => {
            // Always keep if not trimming anything
            if (!trimBlanks && trimValue === null) return true;

            // Check for blank values
            const isBlank = dp.value === null || dp.value === undefined || dp.value === '' || isNaN(dp.value);
            if (trimBlanks && isBlank) return false;

            // Check for specific trim value
            if (trimValue !== null && dp.value === trimValue) return false;

            return true;
        })
    }));
};

/**
 * Build batch updates for save operation
 */
export const buildBatchUpdates = (
    processedData,
    originalData,
    rawContextData,
    isSingleMode,
    path,
    selectedDataField
) => {
    const updates = {};
    const pathString = Array.isArray(path) ? path.join('.') : path;

    if (isSingleMode) {
        // Single object mode - update the object directly
        const singleObject = processedData[0] || {};

        // Update the time series data
        updates[`${pathString}.${selectedDataField}`] = singleObject[selectedDataField];

        // Update any computed fields from onBeforeSave
        Object.keys(singleObject).forEach(key => {
            if (key !== selectedDataField &&
                JSON.stringify(singleObject[key]) !== JSON.stringify(rawContextData[key])) {
                updates[`${pathString}.${key}`] = singleObject[key];
            }
        });
    } else {
        // Array mode - existing logic
        processedData.forEach((contract, index) => {
            // Update the time series data
            updates[`${pathString}.${index}.${selectedDataField}`] = contract[selectedDataField];

            // Update any computed fields from onBeforeSave
            Object.keys(contract).forEach(key => {
                if (key !== selectedDataField &&
                    JSON.stringify(contract[key]) !== JSON.stringify(originalData[index]?.[key])) {
                    updates[`${pathString}.${index}.${key}`] = contract[key];
                }
            });
        });
    }

    return updates;
};