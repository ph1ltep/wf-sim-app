// src/utils/formUtils.js
/**
 * Maps flat form values with dot notation to a properly nested object structure
 * based on the schema's expected structure
 * 
 * @param {Object} formValues - Flat form values from form.getFieldsValue()
 * @param {Object} schema - Optional Yup schema to get default values
 * @returns {Object} Properly nested object
 */
export const mapFormValuesToSchema = (formValues) => {
    // Create result object
    const result = { ...formValues };
    const nestedFields = {};

    // Identify dot notation fields that need to be nested
    Object.keys(formValues).forEach(key => {
        if (key.includes('.')) {
            // Split into path parts (e.g. "correctiveMajorDetails.tooling" => ["correctiveMajorDetails", "tooling"])
            const parts = key.split('.');
            const parentKey = parts[0];
            const childKey = parts[1];

            // Initialize parent object if needed
            if (!nestedFields[parentKey]) {
                nestedFields[parentKey] = {};
            }

            // Add value to nested structure
            nestedFields[parentKey][childKey] = formValues[key];

            // Remove flat field
            delete result[key];
        }
    });

    // Merge nested fields into result
    Object.keys(nestedFields).forEach(parentKey => {
        // Only merge if parent key either doesn't exist or is truthy in the form values
        // This preserves conditional behavior (e.g., if correctiveMajor is false, don't set details)
        if (result[parentKey] !== false) {
            result[parentKey] = {
                ...(result[parentKey] || {}),
                ...nestedFields[parentKey]
            };
        }
    });

    return result;
};

/**
 * Applies form values to a schema instance, handling nested structures
 * 
 * @param {Object} formValues - Form values from form.getFieldsValue()
 * @param {Object} yupSchema - Yup schema to cast values against
 * @returns {Object} Schema-compliant object with proper types and defaults
 */
export const applyFormValuesToSchema = (formValues, yupSchema) => {
    try {
        // First map the form values to proper nested structure
        const mappedValues = mapFormValuesToSchema(formValues);

        // Try to cast values using the schema if provided
        if (yupSchema) {
            try {
                const schemaValues = yupSchema.cast(mappedValues, {
                    stripUnknown: true,
                    defaultValues: true
                });
                return schemaValues;
            } catch (error) {
                console.warn('Schema casting failed, using mapped values:', error);
            }
        }

        return mappedValues;
    } catch (error) {
        console.error('Error applying form values to schema:', error);
        // Return the original values if all else fails
        return formValues;
    }
};