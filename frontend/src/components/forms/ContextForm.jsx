// src/components/forms/ContextForm.jsx - Fixed loading state reset
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Button, Space, Modal, Alert, message } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { get } from 'lodash';

const { confirm } = Modal;

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

    // Initialize form with context data - ALWAYS reset form
    const initializeForm = useCallback(() => {
        // ALWAYS reset loading state on initialization
        setLoading(false);

        let initialValue = getValueByPath(basePath);

        // Handle both direct object references and array indices
        if (initialValue === undefined || initialValue === null) {
            // Check if this looks like a new array item
            const parentPath = basePath.slice(0, -1);
            const itemIndex = basePath[basePath.length - 1];
            const parentArray = getValueByPath(parentPath);

            if (Array.isArray(parentArray) && typeof itemIndex === 'number' && itemIndex === parentArray.length) {
                // This is a new array item - start with generated ID
                initialValue = {
                    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
                };
            } else {
                initialValue = {};
            }
        }

        // Make a deep copy to avoid reference issues
        const initialValues = JSON.parse(JSON.stringify(initialValue));

        // Store initial values for comparison
        initialValuesRef.current = initialValues;

        // ALWAYS reset form fields - this ensures clean state on reopen
        form.resetFields();
        form.setFieldsValue(initialValues);

        // Reset all states to clean slate
        setHasUnsavedChanges(false);
        setValidationErrors([]);
        setLoading(false); // Ensure loading is reset here too
        setIsInitialized(true);
    }, [basePath, getValueByPath, form]);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        if (initialValuesRef.current) {
            form.resetFields();
            form.setFieldsValue(initialValuesRef.current);
            setHasUnsavedChanges(false);
            setValidationErrors([]);
            setLoading(false); // Reset loading state
        } else {
            initializeForm();
        }
    }, [form, initializeForm]);

    // Initialize form on mount and when path changes
    useEffect(() => {
        // Reset loading state whenever path changes (new form instance)
        setLoading(false);
        setIsInitialized(false);
        initializeForm();
    }, [initializeForm]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Handle form submission with proper Ant Design validation FIRST
    const handleFinish = async (values) => {
        try {
            setLoading(true);
            setValidationErrors([]);

            // This should never be called if Ant Design validation fails
            // but let's double-check by explicitly validating
            try {
                const validatedValues = await form.validateFields();
                console.log('Ant Design validation passed:', validatedValues);
            } catch (antdError) {
                console.error('Ant Design validation failed in onFinish:', antdError);
                // This shouldn't happen since onFinish only fires after validation passes
                // but if it does, we stop here
                if (mountedRef.current) {
                    setLoading(false);
                }
                return;
            }

            // Now proceed with schema validation via updateByPath
            const result = await updateByPath(basePath, values);

            if (result.isValid) {
                // Success path
                initialValuesRef.current = JSON.parse(JSON.stringify(values));
                setHasUnsavedChanges(false);
                message.success('Changes saved successfully');

                if (onSubmit) {
                    onSubmit(values);
                }
            } else {
                // Schema validation failed
                const errors = result.errors || [result.error || 'Schema validation failed'];
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

    // Make sure onFinishFailed is properly handling validation failures
    const handleFinishFailed = (errorInfo) => {
        console.log('Ant Design validation failed - onFinish should not be called:', errorInfo);

        // Extract field errors
        const fieldErrors = errorInfo.errorFields?.map(field =>
            `${field.name.join('.')}: ${field.errors.join(', ')}`
        ) || ['Please fix the validation errors above'];

        setValidationErrors(fieldErrors);
        setLoading(false); // Ensure loading is cleared on validation failure
    };

    // Handle form cancellation with confirmation
    const handleCancel = useCallback(() => {
        const performCancel = () => {
            resetForm();
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

    // Handle reset with confirmation
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
                    resetForm();
                }
            });
        } else {
            resetForm();
        }
    }, [hasUnsavedChanges, resetForm]);

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
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            onValuesChange={handleValuesChange}
            layout={formProps.layout || "vertical"}
            style={debugBorders ? { ...formProps.style, ...debugStyle } : formProps.style}
            validateTrigger={['onChange', 'onBlur']}
            {...formProps}
        >
            {/* Validation error display */}
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