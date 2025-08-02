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
export const normalizeTimeSeriesData = (data, selectedField, fieldConfig, yearColumns) => {
    return data.map(item => {
        const normalizedItem = { ...item };
        const timeSeries = item[selectedField] || [];

        // Skip normalization if the field already exists and is not empty
        if (timeSeries.length > 0) {
            return normalizedItem; // Return item unchanged
        }

        // Determine which years to use for this specific item
        let yearsToNormalize = yearColumns;

        if (fieldConfig?.defaultTimeSeriesField) {
            // Use the array from the specified field within this data object
            const defaultYears = item[fieldConfig.defaultTimeSeriesField];
            if (Array.isArray(defaultYears)) {
                yearsToNormalize = defaultYears;
            }
        }

        // Create normalized time series with only the specified years for this item
        const normalizedTimeSeries = yearsToNormalize.map(year => {
            const existingPoint = timeSeries.find(dp => dp.year === year);

            if (existingPoint) {
                // Found existing data point, use it
                return existingPoint;
            } else {
                // Not found in timeSeries, use default value
                let defaultValue = null;

                if (fieldConfig?.defaultValueField) {
                    // Use value from the specified field in the item
                    defaultValue = item[fieldConfig.defaultValueField];
                }

                return { year, value: defaultValue };
            }
        });

        normalizedItem[selectedField] = normalizedTimeSeries;
        return normalizedItem;
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