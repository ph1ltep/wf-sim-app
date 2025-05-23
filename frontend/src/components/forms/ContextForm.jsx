// src/components/forms/ContextForm.jsx - Complete form lifecycle and best practices implementation
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Button, Space, Modal, Spin, Alert, message } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { get } from 'lodash';

const { confirm } = Modal;

/**
 * ContextForm - A form that integrates with Ant Design Form while maintaining
 * context-aware capabilities with proper form isolation and lifecycle management
 * 
 * @param {string[]|string} path - Base path in the context for this form
 * @param {Function} onSubmit - Callback when form is submitted successfully
 * @param {Function} onCancel - Callback when form is cancelled
 * @param {React.ReactNode} children - Form field components
 * @param {string} submitText - Text for submit button
 * @param {string} cancelText - Text for cancel button
 * @param {boolean} showActions - Whether to show action buttons
 * @param {boolean} confirmOnCancel - Whether to show confirmation when cancelling with unsaved changes
 * @param {boolean} resetOnMount - Whether to reset form when component mounts
 * @param {boolean} resetOnUnmount - Whether to reset form when component unmounts
 * @param {boolean} warnOnUnload - Whether to warn user about unsaved changes on page unload
 * @param {boolean} validateOnSubmit - Whether to validate form before submission
 * @param {number} autoSaveInterval - Auto-save interval in milliseconds (0 to disable)
 * @param {Function} onError - Callback when form encounters an error
 * @param {Function} onLoadingChange - Callback when loading state changes
 * @param {Object} formProps - Props to pass to the Ant Design Form component
 */
const ContextForm = ({
    path,
    onSubmit,
    onCancel,
    children,
    submitText = "Save",
    cancelText = "Cancel",
    showActions = true,
    confirmOnCancel = true,
    resetOnMount = true,
    resetOnUnmount = true,
    warnOnUnload = true,
    validateOnSubmit = true,
    autoSaveInterval = 0,
    onError,
    onLoadingChange,
    ...formProps
}) => {
    const { getValueByPath, updateByPath } = useScenario();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [lastSaveTime, setLastSaveTime] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    
    const initialValuesRef = useRef(null);
    const mountedRef = useRef(true);
    const autoSaveTimerRef = useRef(null);
    const unloadListenerRef = useRef(null);

    // Convert path to array if it's a string
    const basePath = Array.isArray(path) ? path : path.split('.');

    // Helper to resolve field path relative to form's base path
    const resolveFieldPath = useCallback((fieldPath) => {
        if (!fieldPath) return [];
        
        // Convert to array if string
        const fieldPathArray = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');
        
        // If field path is relative (doesn't start with base path), prepend base path
        if (fieldPathArray.length < basePath.length ||
            !basePath.every((segment, index) => segment === fieldPathArray[index])) {
            return [...basePath, ...fieldPathArray];
        }
        
        // Field path already includes base path
        return fieldPathArray;
    }, [basePath]);

    // Helper to get relative field path (remove base path)
    const getRelativeFieldPath = useCallback((fieldPath) => {
        if (!fieldPath) return [];
        
        const fieldPathArray = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');
        
        // If field path starts with base path, remove it
        if (fieldPathArray.length >= basePath.length &&
            basePath.every((segment, index) => segment === fieldPathArray[index])) {
            return fieldPathArray.slice(basePath.length);
        }
        
        // Field path is already relative
        return fieldPathArray;
    }, [basePath]);

    // Update loading state and notify parent
    const updateLoadingState = useCallback((newLoading) => {
        setLoading(newLoading);
        if (onLoadingChange) {
            onLoadingChange(newLoading);
        }
    }, [onLoadingChange]);

    // Handle errors and notify parent
    const handleError = useCallback((error, context = 'form operation') => {
        console.error(`ContextForm ${context} error:`, error);
        
        const errorMessage = error?.message || error?.error || `An error occurred during ${context}`;
        setValidationErrors(prev => [...prev, errorMessage]);
        
        if (onError) {
            onError(error, context);
        }
    }, [onError]);

    // Initialize form with context data
    const initializeForm = useCallback(async () => {
        try {
            updateLoadingState(true);
            
            let initialValue = getValueByPath(basePath);
            
            // Handle both direct object references and array indices
            if (initialValue === undefined || initialValue === null) {
                // If we're editing a temp item (new item), initialize with empty object  
                if (basePath[basePath.length - 1] === 'temp_new_item') {
                    initialValue = {};
                } else {
                    console.warn(`No value found at path: ${basePath.join('.')}`);
                    initialValue = {};
                }
            }

            // Make a deep copy to avoid reference issues
            const initialValues = JSON.parse(JSON.stringify(initialValue));
            
            // Store initial values for comparison
            initialValuesRef.current = initialValues;
            
            // Set form values
            form.setFieldsValue(initialValues);
            
            // Reset states
            setHasUnsavedChanges(false);
            setValidationErrors([]);
            setIsInitialized(true);
            setLastSaveTime(new Date());
            
        } catch (error) {
            handleError(error, 'form initialization');
        } finally {
            updateLoadingState(false);
        }
    }, [basePath, getValueByPath, form, updateLoadingState, handleError]);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        if (initialValuesRef.current) {
            form.setFieldsValue(initialValuesRef.current);
            setHasUnsavedChanges(false);
            setValidationErrors([]);
        } else {
            // If no initial values stored, reinitialize
            initializeForm();
        }
    }, [form, initializeForm]);

    // Validate form fields
    const validateForm = useCallback(async () => {
        if (!validateOnSubmit) return { isValid: true, values: form.getFieldsValue() };

        try {
            setIsValidating(true);
            const values = await form.validateFields();
            setValidationErrors([]);
            return { isValid: true, values };
        } catch (errorInfo) {
            const errors = errorInfo.errorFields?.map(field => 
                `${field.name.join('.')}: ${field.errors.join(', ')}`
            ) || ['Form validation failed'];
            
            setValidationErrors(errors);
            return { isValid: false, errors };
        } finally {
            setIsValidating(false);
        }
    }, [form, validateOnSubmit]);

    // Auto-save functionality
    const performAutoSave = useCallback(async () => {
        if (!hasUnsavedChanges || loading) return;

        try {
            const validation = await validateForm();
            if (!validation.isValid) return; // Skip auto-save if validation fails

            const result = await updateByPath(basePath, validation.values);
            
            if (result.isValid) {
                // Update initial values to reflect successful save
                initialValuesRef.current = JSON.parse(JSON.stringify(validation.values));
                setHasUnsavedChanges(false);
                setLastSaveTime(new Date());
                message.success('Auto-saved', 1); // Show for 1 second
            }
        } catch (error) {
            // Auto-save failures are logged but don't show user errors
            console.warn('Auto-save failed:', error);
        }
    }, [hasUnsavedChanges, loading, validateForm, updateByPath, basePath]);

    // Set up auto-save timer
    useEffect(() => {
        if (autoSaveInterval > 0 && hasUnsavedChanges && isInitialized) {
            autoSaveTimerRef.current = setTimeout(performAutoSave, autoSaveInterval);
        }

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
        };
    }, [autoSaveInterval, hasUnsavedChanges, isInitialized, performAutoSave]);

    // Set up page unload warning
    useEffect(() => {
        if (!warnOnUnload) return;

        const handleBeforeUnload = (event) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return event.returnValue;
            }
        };

        if (hasUnsavedChanges) {
            window.addEventListener('beforeunload', handleBeforeUnload);
            unloadListenerRef.current = handleBeforeUnload;
        }

        return () => {
            if (unloadListenerRef.current) {
                window.removeEventListener('beforeunload', unloadListenerRef.current);
                unloadListenerRef.current = null;
            }
        };
    }, [hasUnsavedChanges, warnOnUnload]);

    // Initialize form on mount and when path changes
    useEffect(() => {
        if (resetOnMount || !isInitialized) {
            initializeForm();
        }
    }, [initializeForm, resetOnMount, isInitialized]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            
            // Clear timers
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            
            // Clear event listeners
            if (unloadListenerRef.current) {
                window.removeEventListener('beforeunload', unloadListenerRef.current);
            }
            
            // Reset form if requested
            if (resetOnUnmount) {
                setHasUnsavedChanges(false);
                setIsInitialized(false);
                setValidationErrors([]);
                initialValuesRef.current = null;
            }
        };
    }, [resetOnUnmount]);

    // Handle form submission
    const handleFinish = async (values) => {
        try {
            updateLoadingState(true);
            setValidationErrors([]);
            
            // Validate form if required
            const validation = await validateForm();
            if (!validation.isValid) {
                return; // Validation errors are already set
            }
            
            // Update the context with all form values in a single batch
            const result = await updateByPath(basePath, validation.values);
            
            if (result.isValid) {
                // Update initial values to reflect successful save
                initialValuesRef.current = JSON.parse(JSON.stringify(validation.values));
                
                // Reset dirty state
                setHasUnsavedChanges(false);
                setLastSaveTime(new Date());
                
                // Show success message
                message.success('Changes saved successfully');
                
                // Call the onSubmit callback if provided
                if (onSubmit) {
                    onSubmit(validation.values);
                }
            } else {
                // Handle validation errors from context
                const contextErrors = result.errors || ['Context validation failed'];
                setValidationErrors(contextErrors);
                
                // Set form-level error if needed
                form.setFields([{
                    name: [],
                    errors: contextErrors
                }]);
            }
        } catch (error) {
            handleError(error, 'form submission');
            
            // Set form-level error
            form.setFields([{
                name: [],
                errors: ['An unexpected error occurred during submission']
            }]);
        } finally {
            if (mountedRef.current) {
                updateLoadingState(false);
            }
        }
    };

    // Handle form cancellation with confirmation
    const handleCancel = useCallback(() => {
        const performCancel = () => {
            // Reset form to initial values
            resetForm();
            
            // Call the onCancel callback if provided
            if (onCancel) {
                onCancel();
            }
        };

        // Show confirmation if there are unsaved changes and confirmation is enabled
        if (hasUnsavedChanges && confirmOnCancel) {
            confirm({
                title: 'Unsaved Changes',
                icon: <ExclamationCircleOutlined />,
                content: 'You have unsaved changes. Are you sure you want to cancel? Your changes will be lost.',
                okText: 'Yes, Cancel',
                okType: 'danger',
                cancelText: 'Keep Editing',
                onOk: performCancel
            });
        } else {
            performCancel();
        }
    }, [hasUnsavedChanges, confirmOnCancel, resetForm, onCancel]);

    // Handle manual reset
    const handleReset = useCallback(() => {
        if (hasUnsavedChanges) {
            confirm({
                title: 'Reset Form',
                icon: <ExclamationCircleOutlined />,
                content: 'This will reset all fields to their original values. Any unsaved changes will be lost.',
                okText: 'Reset',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: resetForm
            });
        } else {
            resetForm();
        }
    }, [hasUnsavedChanges, resetForm]);

    // Enhanced form value change handler
    const handleValuesChange = useCallback((changedValues, allValues) => {
        if (!isInitialized || !initialValuesRef.current) {
            return;
        }

        // Compare current values with initial values
        const hasChanges = JSON.stringify(allValues) !== JSON.stringify(initialValuesRef.current);
        
        if (hasChanges !== hasUnsavedChanges) {
            setHasUnsavedChanges(hasChanges);
        }

        // Clear validation errors when user starts typing
        if (validationErrors.length > 0) {
            setValidationErrors([]);
        }

        // Call parent's onValuesChange if provided
        if (formProps.onValuesChange) {
            formProps.onValuesChange(changedValues, allValues);
        }
    }, [isInitialized, hasUnsavedChanges, validationErrors.length, formProps]);

    // Enhanced value getter for ContextFields in form mode
    const getFormValue = useCallback((fieldPath, defaultValue = null) => {
        if (!isInitialized) {
            return defaultValue;
        }

        // Get relative path for form field access
        const relativePath = getRelativeFieldPath(fieldPath);
        
        // Handle simple property name (single level)
        if (relativePath.length === 1) {
            return form.getFieldValue(relativePath[0]) ?? defaultValue;
        }
        
        // Handle nested paths
        if (relativePath.length > 1) {
            const allValues = form.getFieldsValue();
            return get(allValues, relativePath, defaultValue);
        }
        
        // Handle empty path (return all form values)
        if (relativePath.length === 0) {
            return form.getFieldsValue();
        }

        return defaultValue;
    }, [form, isInitialized, getRelativeFieldPath]);

    // Enhanced value updater for ContextFields in form mode
    const updateFormValue = useCallback((fieldPath, value) => {
        if (!isInitialized) {
            return { isValid: false, applied: 0, error: 'Form not initialized' };
        }

        try {
            // Get relative path for form field access
            const relativePath = getRelativeFieldPath(fieldPath);
            
            // Handle simple property name (single level)
            if (relativePath.length === 1) {
                form.setFieldValue(relativePath[0], value);
                return { isValid: true, applied: 1, value };
            }
            
            // Handle nested paths
            if (relativePath.length > 1) {
                form.setFieldValue(relativePath, value);
                return { isValid: true, applied: 1, value };
            }
            
            // Handle empty path (update all form values)
            if (relativePath.length === 0) {
                form.setFieldsValue(value);
                return { isValid: true, applied: 1, value };
            }

            return { isValid: false, applied: 0, error: 'Invalid field path' };
        } catch (error) {
            console.error('Form value update error:', error);
            return { 
                isValid: false, 
                applied: 0, 
                error: 'Failed to update form value',
                errors: [error.message]
            };
        }
    }, [form, isInitialized, getRelativeFieldPath]);

    // Clone children with enhanced form props
    const renderChildren = () => {
        if (!isInitialized) {
            return null; // Don't render children until form is initialized
        }

        return React.Children.map(children, child => {
            // Skip non-element children
            if (!React.isValidElement(child)) {
                return child;
            }

            // Only enhance ContextField components and components that accept formMode
            const isContextField = child.type && (
                child.type.name === 'ContextField' || 
                child.type.displayName === 'ContextField' ||
                child.props.path !== undefined
            );

            if (isContextField) {
                // Clone ContextField with enhanced form props
                return React.cloneElement(child, {
                    formMode: true,
                    getValueOverride: getFormValue,
                    updateValueOverride: updateFormValue,
                    // Add Form.Item name for Ant Design form integration
                    name: getRelativeFieldPath(child.props.path)
                });
            }

            // For non-ContextField components, pass through unchanged
            return child;
        });
    };

    // Debug border support
    const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
    const debugStyle = debugBorders ? {
        border: '2px dashed blue',
        padding: '8px',
        margin: '4px'
    } : {};

    // Don't render until initialized
    if (!isInitialized) {
        return (
            <div style={debugStyle}>
                <Spin tip="Initializing form...">
                    <Form layout={formProps.layout || "vertical"}>
                        <Form.Item>
                            <div style={{ minHeight: 100 }} />
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        );
    }

    return (
        <Form
            form={form}
            onFinish={handleFinish}
            onValuesChange={handleValuesChange}
            layout={formProps.layout || "vertical"}
            style={debugBorders ? { ...formProps.style, ...debugStyle } : formProps.style}
            {...formProps}
        >
            {/* Validation errors display */}
            {validationErrors.length > 0 && (
                <Alert
                    message="Form Validation Errors"
                    description={
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    }
                    type="error"
                    closable
                    onClose={() => setValidationErrors([])}
                    style={{ marginBottom: 16 }}
                />
            )}

            {renderChildren()}

            {showActions && (
                <Form.Item style={{ marginTop: 24 }}>
                    <Space>
                        {cancelText && (
                            <Button 
                                icon={<CloseOutlined />}
                                onClick={handleCancel} 
                                disabled={loading || isValidating}
                            >
                                {cancelText}
                            </Button>
                        )}
                        
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            disabled={loading || isValidating}
                            title="Reset form to original values"
                        >
                            Reset
                        </Button>
                        
                        {submitText && (
                            <Button 
                                type="primary"
                                icon={<SaveOutlined />}
                                htmlType="submit" 
                                loading={loading || isValidating}
                            >
                                {submitText}
                                {hasUnsavedChanges && ' *'}
                            </Button>
                        )}
                    </Space>
                    
                    {/* Status information */}
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        {hasUnsavedChanges && (
                            <div style={{ color: '#faad14' }}>
                                * You have unsaved changes
                                {autoSaveInterval > 0 && (
                                    <span> (auto-save enabled)</span>
                                )}
                            </div>
                        )}
                        {lastSaveTime && !hasUnsavedChanges && (
                            <div style={{ color: '#52c41a' }}>
                                Last saved: {lastSaveTime.toLocaleTimeString()}
                            </div>
                        )}
                        {isValidating && (
                            <div style={{ color: '#1890ff' }}>
                                Validating form...
                            </div>
                        )}
                    </div>
                </Form.Item>
            )}
        </Form>
    );
};

export default ContextForm;