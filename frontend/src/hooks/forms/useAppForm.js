// src/hooks/forms/useAppForm.js
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';

/**
 * Custom hook that extends React Hook Form with additional features
 * for consistent form handling throughout the application
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.validationSchema - Yup validation schema
 * @param {Object} options.defaultValues - Default form values
 * @param {Function} options.onSubmit - Submit handler function
 * @param {Function} options.onError - Error handler function
 * @param {boolean} options.persistForm - Whether to persist form values in localStorage
 * @param {string} options.persistKey - Key to use for localStorage persistence
 * @param {Function} options.transformBeforeSave - Transform values before saving to context
 * @param {Object} options.context - Context to save values to (e.g., from useScenario)
 * @param {boolean} options.showSuccessMessage - Whether to show success message on save
 * @param {string} options.successMessage - Custom success message
 * @returns {Object} Extended form methods and state
 */
export const useAppForm = ({
    validationSchema,
    defaultValues = {},
    onSubmit,
    onError,
    persistForm = false,
    persistKey,
    transformBeforeSave,
    context,
    showSuccessMessage = true,
    successMessage = 'Form saved successfully',
    ...options
}) => {
    // Component mounted state
    const [isMounted, setIsMounted] = useState(false);

    // Get stored values if persistence is enabled
    const getStoredValues = useCallback(() => {
        if (persistForm && persistKey && typeof window !== 'undefined') {
            try {
                const storedValues = localStorage.getItem(persistKey);
                if (storedValues) {
                    return JSON.parse(storedValues);
                }
            } catch (error) {
                console.error('Error retrieving stored form values:', error);
            }
        }
        return null;
    }, [persistForm, persistKey]);

    // Initialize the form
    const methods = useForm({
        resolver: validationSchema ? yupResolver(validationSchema) : undefined,
        defaultValues: getStoredValues() || defaultValues,
        mode: 'onChange',
        ...options
    });

    const {
        handleSubmit,
        reset,
        formState: { isDirty, isSubmitting, errors },
        watch,
        getValues
    } = methods;

    // Enhanced submit handler
    const submitHandler = useCallback((data) => {
        // Transform data if needed
        const transformedData = transformBeforeSave ? transformBeforeSave(data) : data;

        // Save to context if provided
        if (context && context.updateData) {
            context.updateData(transformedData);
        }

        // Store in localStorage if persistence is enabled
        if (persistForm && persistKey) {
            try {
                localStorage.setItem(persistKey, JSON.stringify(transformedData));
            } catch (error) {
                console.error('Error storing form values:', error);
            }
        }

        // Show success message
        if (showSuccessMessage) {
            message.success(successMessage);
        }

        // Call the provided onSubmit handler
        if (onSubmit) {
            return onSubmit(transformedData);
        }
    }, [
        onSubmit,
        transformBeforeSave,
        context,
        persistForm,
        persistKey,
        showSuccessMessage,
        successMessage
    ]);

    // Enhanced error handler
    const errorHandler = useCallback((errors) => {
        console.error('Form validation errors:', errors);

        // Show error message
        message.error('Please fix the form errors before submitting');

        // Call the provided onError handler
        if (onError) {
            onError(errors);
        }
    }, [onError]);

    // Wrapped submit handler with error handling
    const onSubmitForm = handleSubmit(submitHandler, errorHandler);

    // Effect to update form when defaultValues change

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        // Only reset if not dirty or explicitly told to reset
        if (!isDirty || options.resetOnDefaultValuesChange) {
            reset(defaultValues);
        }
    }, [reset, options.resetOnDefaultValuesChange, isMounted]);  // Removed defaultValues and isDirty from dependencies

    // Clear localStorage when component unmounts
    useEffect(() => {
        return () => {
            if (persistForm && persistKey && options.clearOnUnmount) {
                try {
                    localStorage.removeItem(persistKey);
                } catch (error) {
                    console.error('Error clearing stored form values:', error);
                }
            }
        };
    }, [persistForm, persistKey, options.clearOnUnmount]);

    // Return extended methods and state
    return {
        ...methods,
        onSubmitForm,
        isSubmitting,
        isDirty,
        hasErrors: Object.keys(errors).length > 0,
    };
};