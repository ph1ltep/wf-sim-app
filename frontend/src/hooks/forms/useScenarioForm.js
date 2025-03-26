// src/hooks/forms/useScenarioForm.js
import { useEffect, useCallback } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import { useAppForm } from './useAppForm';
import { message } from 'antd';

/**
 * Custom hook for forms that integrate with ScenarioContext
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.validationSchema - Yup validation schema
 * @param {string} options.moduleName - Name of the module to update in the scenario
 * @param {string} options.modulePath - Path to the module within scenario settings
 * @param {Function} options.transformBeforeSave - Transform form data before saving
 * @param {Function} options.transformBeforeLoad - Transform scenario data before loading into form
 * @param {boolean} options.showSuccessMessage - Whether to show success message
 * @param {string} options.successMessage - Success message text
 * @returns {Object} Form methods and state
 */
export const useScenarioForm = ({
    validationSchema,
    moduleName,
    modulePath,
    transformBeforeSave,
    transformBeforeLoad,
    showSuccessMessage = true,
    successMessage = 'Changes saved successfully',
    ...options
}) => {
    // Get scenario context
    const {
        getValueByPath,
        updateModuleSettings,
        updateSettings,
        updateByPath,
        scenarioData,
        hasValidScenario
    } = useScenario();

    // Determine the correct path and value for the form
    const path = modulePath || (moduleName ? ['settings', 'modules', moduleName] : null);
    const moduleData = path ? getValueByPath(path, {}) : {};

    // Transform data before loading into form if needed
    const transformedData = transformBeforeLoad ? transformBeforeLoad(moduleData) : moduleData;

    // Create submit handler to update the scenario context
    const onSubmit = useCallback((data) => {
        if (!hasValidScenario()) {
            message.error('No active scenario');
            return;
        }

        // Transform data before saving if needed
        const finalData = transformBeforeSave ? transformBeforeSave(data) : data;

        try {
            // Use the appropriate update method based on provided options
            if (moduleName) {
                // Update a specific module in settings.modules
                updateModuleSettings(moduleName, finalData);
            } else if (modulePath) {
                // Update at a specific path
                updateByPath(modulePath, finalData);
            } else if (path && path[0] === 'settings' && !path[1]) {
                // Update a top-level settings section
                updateSettings(path[1], finalData);
            } else {
                console.warn('No valid update path provided to useScenarioForm');
                return;
            }

            // Show success message if enabled
            if (showSuccessMessage) {
                message.success(successMessage);
            }

            return finalData;
        } catch (error) {
            console.error('Error updating scenario:', error);
            message.error('Failed to save changes');
            throw error;
        }
    }, [
        hasValidScenario,
        transformBeforeSave,
        moduleName,
        modulePath,
        path,
        updateModuleSettings,
        updateByPath,
        updateSettings,
        showSuccessMessage,
        successMessage
    ]);

    // Initialize the form with the app form hook
    const form = useAppForm({
        validationSchema,
        defaultValues: transformedData,
        onSubmit,
        ...options
    });

    // Update form values when moduleData changes
    useEffect(() => {
        if (options.watchExternalChanges !== false && moduleData && Object.keys(moduleData).length > 0) {
            // Transform data before loading if needed
            const newData = transformBeforeLoad ? transformBeforeLoad(moduleData) : moduleData;

            // Only reset if there are meaningful differences to avoid infinite loops
            form.reset(newData);
        }
    }, [moduleData, transformBeforeLoad, options.watchExternalChanges]); // Remove form.reset from dependencies

    // Return the form methods and additional helpers
    return {
        ...form,
        moduleData,
        isScenarioValid: hasValidScenario(),
        scenarioData
    };
};