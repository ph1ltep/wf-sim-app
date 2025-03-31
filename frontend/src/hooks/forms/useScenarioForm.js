// src/hooks/forms/useScenarioForm.js
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { message } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { useAppForm } from './useAppForm';

/**
 * Custom hook for forms that integrate with ScenarioContext
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.validationSchema - Yup validation schema
 * @param {string} options.moduleName - Name of the module to update in the scenario
 * @param {string[]} options.modulePath - Path to the module within scenario settings
 * @param {string} options.formId - Explicit form ID for registration (overrides auto-generation)
 * @param {Function} options.transformBeforeSave - Transform form data before saving
 * @param {Function} options.transformBeforeLoad - Transform scenario data before loading into form
 * @param {boolean} options.showSuccessMessage - Whether to show success message
 * @param {string} options.successMessage - Success message text
 * @param {boolean} options.skipRegistration - Skip form handler registration (for problematic components)
 * @returns {Object} Form methods and state
 */
export const useScenarioForm = ({
    validationSchema,
    moduleName,
    modulePath,
    formId,
    transformBeforeSave,
    transformBeforeLoad,
    showSuccessMessage = true,
    successMessage = 'Changes saved successfully',
    skipRegistration = false,
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

    // Generate a unique form ID if not provided explicitly
    const generatedFormId = useMemo(() =>
        formId ||
        (modulePath ? modulePath.join('.') :
            moduleName ? `modules.${moduleName}` :
                'unknown'),
        [formId, modulePath, moduleName]);

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

    // Store submitForm in a ref to maintain stability
    const submitFormRef = useRef(submitForm);
    
    // Keep the ref updated with the latest submitForm
    useEffect(() => {
        submitFormRef.current = submitForm;
    }, [submitForm]);

    // Use a more stable registration approach - only register once
    useLayoutEffect(() => {
        // Skip registration if requested
        if (skipRegistration) return;

        let isActive = true;
        let unregister = null;
        
        if (isActive && generatedFormId) {
            // Register only once per component mount
            console.log(`Initial registration for form: ${generatedFormId}`);
            unregister = registerFormSubmitHandler(generatedFormId, () => submitFormRef.current());
        }
        
        // Clean up registration only on unmount
        return () => {
            isActive = false;
            if (unregister) {
                unregister();
            }
        };
    }, [generatedFormId, registerFormSubmitHandler, skipRegistration]);

    // Update global dirty state when form state changes - use generatedFormId
    useEffect(() => {
        updateFormDirtyState(isDirty, generatedFormId);

        // Clean up when component unmounts
        return () => {
            updateFormDirtyState(false, generatedFormId);
        };
    }, [isDirty, generatedFormId, updateFormDirtyState]);

    // Create a custom reset function that properly resets to context values
    const resetFormToContext = useCallback(() => {
        if (path) {
            const contextData = getValueByPath(path, {});
            const formData = transformBeforeLoad ? transformBeforeLoad(contextData) : contextData;

            // Use reset from methods
            reset(formData);

            // Clear dirty state
            updateFormDirtyState(false, generatedFormId);
        }
    }, [getValueByPath, path, reset, transformBeforeLoad, updateFormDirtyState, generatedFormId]);

    // Update form values when moduleData changes (but only if explicitly watching for changes)
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
