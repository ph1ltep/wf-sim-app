// src/components/forms/ContextForm.jsx - Final simplified implementation with form actions
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Button, Space, Modal, Alert, message } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { get } from 'lodash';

const { confirm } = Modal;

/**
 * ContextForm - Simplified form with context integration and basic validation
 * 
 * @param {string[]|string} path - Base path in the context for this form
 * @param {Function} onSubmit - Callback when form is submitted successfully
 * @param {Function} onCancel - Callback when form is cancelled
 * @param {React.ReactNode} children - Form field components
 * @param {string} submitText - Text for submit button
 * @param {string} cancelText - Text for cancel button
 * @param {boolean} showActions - Whether to show action buttons
 * @param {boolean} confirmOnCancel - Whether to show confirmation when cancelling with unsaved changes
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
    ...formProps
}) => {
    const { getValueByPath, updateByPath } = useScenario();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);

    const initialValuesRef = useRef(null);
    const mountedRef = useRef(true);

    // Convert path to array if it's a string
    const basePath = Array.isArray(path) ? path : path.split('.');

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

    // Initialize form with context data (always on mount)
    const initializeForm = useCallback(() => {
        let initialValue = getValueByPath(basePath);

        // Handle both direct object references and array indices
        if (initialValue === undefined || initialValue === null) {
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
    }, [basePath, getValueByPath, form]);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        if (initialValuesRef.current) {
            form.setFieldsValue(initialValuesRef.current);
            setHasUnsavedChanges(false);
            setValidationErrors([]);
        } else {
            initializeForm();
        }
    }, [form, initializeForm]);

    // Initialize form on mount and when path changes
    useEffect(() => {
        initializeForm();
    }, [initializeForm]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // FAL-1: Use Ant Design Form's onFinish for submission
    const handleFinish = async (values) => {
        try {
            setLoading(true);
            setValidationErrors([]);

            // FAL-2: Implement batched context updates on form submission only
            const result = await updateByPath(basePath, values);

            if (result.isValid) {
                // Update initial values to reflect successful save
                initialValuesRef.current = JSON.parse(JSON.stringify(values));

                // Reset states
                setHasUnsavedChanges(false);

                // Show success message
                message.success('Changes saved successfully');

                // FAL-4: Maintain custom onSubmit callback support
                if (onSubmit) {
                    onSubmit(values);
                }
            } else {
                // Display validation errors from updateByPath
                const errors = result.errors || [result.error || 'Validation failed'];
                setValidationErrors(errors);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setValidationErrors(['An unexpected error occurred during submission']);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    // Handle form cancellation with confirmation
    const handleCancel = useCallback(() => {
        const performCancel = () => {
            resetForm();
            // FAL-4: Maintain custom onCancel callback support
            if (onCancel) {
                onCancel();
            }
        };

        if (hasUnsavedChanges && confirmOnCancel) {
            confirm({
                title: 'Unsaved Changes',
                icon: <ExclamationCircleOutlined />,
                content: 'You have unsaved changes. Are you sure you want to cancel?',
                okText: 'Yes, Cancel',
                okType: 'danger',
                cancelText: 'Keep Editing',
                onOk: performCancel
            });
        } else {
            performCancel();
        }
    }, [hasUnsavedChanges, confirmOnCancel, resetForm, onCancel]);

    // FAL-3: Support Ant Design Form's reset method
    const handleReset = useCallback(() => {
        if (hasUnsavedChanges) {
            confirm({
                title: 'Reset Form',
                icon: <ExclamationCircleOutlined />,
                content: 'This will reset all fields to their original values.',
                okText: 'Reset',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => {
                    form.resetFields();
                    resetForm();
                }
            });
        } else {
            form.resetFields();
            resetForm();
        }
    }, [hasUnsavedChanges, resetForm, form]);

    // FAL-3: Support Ant Design Form's validate method
    const validateFields = useCallback(async () => {
        try {
            const values = await form.validateFields();
            return { isValid: true, values };
        } catch (errorInfo) {
            const errors = errorInfo.errorFields?.map(field =>
                `${field.name.join('.')}: ${field.errors.join(', ')}`
            ) || ['Form validation failed'];
            return { isValid: false, errors };
        }
    }, [form]);

    // Handle form value changes
    const handleValuesChange = useCallback((changedValues, allValues) => {
        if (!isInitialized || !initialValuesRef.current) {
            return;
        }

        // Simple comparison to detect changes
        const hasChanges = JSON.stringify(allValues) !== JSON.stringify(initialValuesRef.current);
        setHasUnsavedChanges(hasChanges);

        // Clear validation errors when user starts editing
        if (validationErrors.length > 0) {
            setValidationErrors([]);
        }

        // Call parent's onValuesChange if provided
        if (formProps.onValuesChange) {
            formProps.onValuesChange(changedValues, allValues);
        }
    }, [isInitialized, validationErrors.length, formProps]);

    // Value getter for ContextFields in form mode
    const getFormValue = useCallback((fieldPath, defaultValue = null) => {
        if (!isInitialized) return defaultValue;

        const relativePath = getRelativeFieldPath(fieldPath);

        if (relativePath.length === 1) {
            return form.getFieldValue(relativePath[0]) ?? defaultValue;
        }

        if (relativePath.length > 1) {
            const allValues = form.getFieldsValue();
            return get(allValues, relativePath, defaultValue);
        }

        if (relativePath.length === 0) {
            return form.getFieldsValue();
        }

        return defaultValue;
    }, [form, isInitialized, getRelativeFieldPath]);

    // Value updater for ContextFields in form mode
    const updateFormValue = useCallback((fieldPath, value) => {
        if (!isInitialized) {
            return { isValid: false, applied: 0, error: 'Form not initialized' };
        }

        try {
            const relativePath = getRelativeFieldPath(fieldPath);

            if (relativePath.length === 1) {
                form.setFieldValue(relativePath[0], value);
                return { isValid: true, applied: 1, value };
            }

            if (relativePath.length > 1) {
                form.setFieldValue(relativePath, value);
                return { isValid: true, applied: 1, value };
            }

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
                error: 'Failed to update form value'
            };
        }
    }, [form, isInitialized, getRelativeFieldPath]);

    // Clone children with form props
    const renderChildren = () => {
        if (!isInitialized) return null;

        return React.Children.map(children, child => {
            if (!React.isValidElement(child)) {
                return child;
            }

            // Only enhance ContextField components
            const isContextField = child.type && (
                child.type.name === 'ContextField' ||
                child.type.displayName === 'ContextField' ||
                child.props.path !== undefined
            );

            if (isContextField) {
                return React.cloneElement(child, {
                    formMode: true,
                    getValueOverride: getFormValue,
                    updateValueOverride: updateFormValue,
                    name: getRelativeFieldPath(child.props.path)
                });
            }

            return child;
        });
    };

    // Expose form methods for external access (FAL-3)
    const formRef = useCallback((instance) => {
        if (instance && formProps.ref) {
            if (typeof formProps.ref === 'function') {
                formProps.ref({
                    ...instance,
                    validateContextFields: validateFields,
                    resetToInitial: resetForm,
                    getInitialValues: () => initialValuesRef.current,
                    hasUnsavedChanges: () => hasUnsavedChanges
                });
            } else {
                formProps.ref.current = {
                    ...instance,
                    validateContextFields: validateFields,
                    resetToInitial: resetForm,
                    getInitialValues: () => initialValuesRef.current,
                    hasUnsavedChanges: () => hasUnsavedChanges
                };
            }
        }
    }, [formProps.ref, validateFields, resetForm, hasUnsavedChanges]);

    // Debug border support
    const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
    const debugStyle = debugBorders ? {
        border: '2px dashed blue',
        padding: '8px',
        margin: '4px'
    } : {};

    if (!isInitialized) {
        return (
            <div style={debugStyle}>
                <Form layout={formProps.layout || "vertical"}>
                    <div>Loading form...</div>
                </Form>
            </div>
        );
    }

    return (
        <Form
            form={form}
            ref={formRef}
            onFinish={handleFinish}
            onValuesChange={handleValuesChange}
            layout={formProps.layout || "vertical"}
            style={debugBorders ? { ...formProps.style, ...debugStyle } : formProps.style}
            {...formProps}
        >
            {/* Simple validation error display */}
            {validationErrors.length > 0 && (
                <Alert
                    message="Validation Errors"
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
                                disabled={loading}
                            >
                                {cancelText}
                            </Button>
                        )}

                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            disabled={loading}
                        >
                            Reset
                        </Button>

                        {submitText && (
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                htmlType="submit"
                                loading={loading}
                            >
                                {submitText}
                                {hasUnsavedChanges && ' *'}
                            </Button>
                        )}
                    </Space>

                    {hasUnsavedChanges && (
                        <div style={{
                            marginTop: 8,
                            fontSize: '12px',
                            color: '#faad14'
                        }}>
                            * You have unsaved changes
                        </div>
                    )}
                </Form.Item>
            )}
        </Form>
    );
};

export default ContextForm;