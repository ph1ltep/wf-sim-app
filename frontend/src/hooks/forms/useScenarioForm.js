// src/hooks/forms/useScenarioForm.js
import { useEffect, useCallback, useMemo } from 'react';
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
// src/hooks/forms/useScenarioForm.js

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
        hasValidScenario,
        updateFormDirtyState,
        registerFormSubmitHandler
    } = useScenario();

    // Generate a unique form ID
    const formId = useMemo(() => 
        modulePath ? modulePath.join('.') : 
        moduleName ? `modules.${moduleName}` : 
        'unknown',
    [modulePath, moduleName]);

    // Calculate path using useMemo to avoid recreating in dependencies
    const path = useMemo(() => 
        modulePath || (moduleName ? ['settings', 'modules', moduleName] : null),
    [modulePath, moduleName]);

    // Get module data using the calculated path
    const moduleData = useMemo(() => 
        path ? getValueByPath(path, {}) : {},
    [path, getValueByPath]);

    // Transform data before loading into form if needed
    const transformedData = useMemo(() => 
        transformBeforeLoad ? transformBeforeLoad(moduleData) : moduleData,
    [moduleData, transformBeforeLoad]);

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
    const methods = useAppForm({
        validationSchema,
        defaultValues: transformedData,
        onSubmit,
        ...options
    });

    // Now that methods is initialized, we can safely destructure it
    const { formState: { isDirty }, handleSubmit } = methods;
    
    // Get the reset function separately to avoid the initialization error
    const { reset } = methods;

    // Create a submit function that can be called from context
    const submitForm = useCallback(() => {
        return handleSubmit(onSubmit)();
    }, [handleSubmit, onSubmit]);
    
    // Create a custom reset function that properly resets to context values
    const resetFormToContext = useCallback(() => {
        console.log("Resetting form to context values");
        
        if (path) {
            const contextData = getValueByPath(path, {});
            const formData = transformBeforeLoad ? transformBeforeLoad(contextData) : contextData;
            
            // Use reset from methods
            reset(formData);
            
            // Clear dirty state
            updateFormDirtyState(false, formId);
        }
    }, [getValueByPath, path, reset, transformBeforeLoad, updateFormDirtyState, formId]);
    
    // Register the form's submit handler
    useEffect(() => {
        if (formId) {
            const unregister = registerFormSubmitHandler(formId, submitForm);
            return unregister; // Cleanup on unmount
        }
    }, [formId, submitForm, registerFormSubmitHandler]);
    
    // Update global dirty state when form state changes
    useEffect(() => {
        updateFormDirtyState(isDirty, formId);
        
        // Clean up when component unmounts
        return () => {
            updateFormDirtyState(false, formId);
        };
    }, [isDirty, formId, updateFormDirtyState]);

    // Update form values when moduleData changes
    useEffect(() => {
        if (options.watchExternalChanges !== false && 
            moduleData && 
            Object.keys(moduleData).length > 0) {
            // Transform data before loading if needed
            const newData = transformBeforeLoad ? transformBeforeLoad(moduleData) : moduleData;

            // Only reset if there are meaningful differences to avoid infinite loops
            reset(newData);
        }
    }, [moduleData, transformBeforeLoad, options.watchExternalChanges, reset]);

    // Return the form methods and additional helpers
    return {
        ...methods,
        moduleData,
        isScenarioValid: hasValidScenario(),
        scenarioData,
        onSubmitForm: submitForm,
        reset: resetFormToContext // Replace the original reset with our custom one
    };
};