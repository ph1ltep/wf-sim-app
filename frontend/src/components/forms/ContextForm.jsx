// src/components/contextFields/ContextForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Space } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { produce } from 'immer';
import { get, set } from 'lodash';

/**
 * ContextForm - A form that collects changes from ContextField components
 * and only updates the scenario context when submitted
 * 
 * @param {string[]|string} path - Base path in the context for this form
 * @param {Function} onSubmit - Callback when form is submitted successfully
 * @param {Function} onCancel - Callback when form is cancelled
 * @param {React.ReactNode} children - Form field components
 * @param {string} layout - Form layout: 'vertical' (default), 'horizontal', 'inline'
 * @param {Object} labelCol - Label column configuration for horizontal layout
 * @param {Object} wrapperCol - Wrapper column configuration for horizontal layout
 * @param {boolean} compact - Whether to use compact spacing
 * @param {boolean} responsive - Whether to enable responsive behavior
 * @param {Object} formProps - Props to pass to the antd Form component
 */
const ContextForm = ({
    path,
    onSubmit,
    onCancel,
    children,
    submitText = "Save",
    cancelText = "Cancel",
    showActions = true,
    layout = "vertical",
    labelCol,
    wrapperCol,
    compact = false,
    responsive = false,
    ...formProps
}) => {
    const { getValueByPath, updateByPath } = useScenario();

    // Convert path to array if it's a string
    const basePath = Array.isArray(path) ? path : path.split('.');

    // Initialize form state from context
    const [formState, setFormState] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);

    // Load initial values from context
    useEffect(() => {
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
        setFormState(JSON.parse(JSON.stringify(initialValue)));
        setIsInitialized(true);
    }, [basePath, getValueByPath]);

    // Form submission handler
    const handleSubmit = () => {
        // Update the context with all collected changes
        updateByPath(basePath, formState);

        // Call the onSubmit callback if provided
        if (onSubmit) {
            onSubmit(formState);
        }
    };

    // Form cancel handler
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    // Field value getter (for form state)
    const getFormValue = (fieldPath) => {
        console.log('getFormValue called with fieldPath:', fieldPath, 'basePath:', basePath, 'formState:', formState);

        // Split dot notation strings into arrays before processing
        let fieldPathArray;
        if (typeof fieldPath === 'string' && fieldPath.includes('.')) {
            fieldPathArray = fieldPath.split('.');
        } else if (Array.isArray(fieldPath)) {
            fieldPathArray = fieldPath;
        } else {
            fieldPathArray = [fieldPath];
        }

        // Handle simple property name (single element array)
        if (fieldPathArray.length === 1) {
            return formState[fieldPathArray[0]];
        }

        // Check if fieldPath already contains basePath elements
        let relativePath;
        if (fieldPathArray.length < basePath.length ||
            !basePath.every((segment, index) => segment === fieldPathArray[index])) {
            // fieldPath doesn't contain basePath, use it directly
            relativePath = fieldPathArray;
        } else {
            // fieldPath contains basePath, extract relativePath
            relativePath = fieldPathArray.slice(basePath.length);
        }

        return get(formState, relativePath);
    };

    // Field update handler
    const updateFormValue = (fieldPath, value) => {
        console.log('updateFormValue called with fieldPath:', fieldPath, 'value:', value, 'basePath:', basePath);

        // Split dot notation strings into arrays before processing
        let fieldPathArray;
        if (typeof fieldPath === 'string' && fieldPath.includes('.')) {
            fieldPathArray = fieldPath.split('.');
        } else if (Array.isArray(fieldPath)) {
            fieldPathArray = fieldPath;
        } else {
            fieldPathArray = [fieldPath];
        }

        // Handle simple property name (single element array)
        if (fieldPathArray.length === 1) {
            setFormState(produce(formState, draft => {
                draft[fieldPathArray[0]] = value;
            }));
            return { isValid: true, applied: true, value };
        }

        // Check if fieldPath already contains basePath elements
        let relativePath;
        if (fieldPathArray.length < basePath.length ||
            !basePath.every((segment, index) => segment === fieldPathArray[index])) {
            // fieldPath doesn't contain basePath, use it directly
            relativePath = fieldPathArray;
        } else {
            // fieldPath contains basePath, extract relativePath
            relativePath = fieldPathArray.slice(basePath.length);
        }

        // Update form state immutably using Immer
        setFormState(produce(formState, draft => {
            if (relativePath.length === 0) {
                // If no relative path, replace the entire state
                return value;
            } else {
                set(draft, relativePath, value);
            }
        }));

        // Return success object to match updateByPathV2 format
        return { isValid: true, applied: true, value };
    };

    // Calculate form layout configuration
    const getFormLayoutConfig = () => {
        const config = {
            layout: layout === 'horizontal' ? 'vertical' : layout, // Use vertical for Form, handle horizontal in ContextField
            ...formProps
        };

        // Only apply labelCol/wrapperCol for true Ant Design horizontal layout
        // Our custom horizontal layout is handled in ContextField
        if (layout === 'horizontal' && (labelCol || wrapperCol)) {
            // If specific column config is provided, use Ant Design's horizontal layout
            config.layout = 'horizontal';
            config.labelCol = labelCol;
            config.wrapperCol = wrapperCol;
        }

        return config;
    };

    // Get form item style for compact mode
    const getFormItemStyle = () => {
        if (!compact) return {};

        return {
            marginBottom: layout === 'inline' ? 8 : 12 // Reduced from default 24px
        };
    };

    // Clone children with form props
    const renderChildren = () => {
        if (!isInitialized) return null;

        return React.Children.map(children, child => {
            // Skip non-element children
            if (!React.isValidElement(child)) {
                return child;
            }

            // Clone the element with form props
            return React.cloneElement(child, {
                formMode: true, // This should be set to true
                getValueOverride: getFormValue,
                updateValueOverride: updateFormValue,
                // Pass layout configuration to child fields
                layout,
                compact,
                responsive,
                formItemStyle: getFormItemStyle()
            });
        });
    };

    // Debug border styling - controlled by environment variable
    const getDebugStyle = () => {
        if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
            return {
                border: '1px solid #1890ff',
                borderRadius: '4px',
                padding: '8px',
                margin: '4px 0'
            };
        }
        return {};
    };

    return (
        <div style={getDebugStyle()}>
            <Form
                onFinish={handleSubmit}
                {...getFormLayoutConfig()}
            >
                {renderChildren()}

                {showActions && (
                    <Form.Item
                        className="form-actions"
                        style={getFormItemStyle()}
                    >
                        <Space>
                            {cancelText && (
                                <Button onClick={handleCancel}>
                                    {cancelText}
                                </Button>
                            )}
                            {submitText && (
                                <Button type="primary" htmlType="submit">
                                    {submitText}
                                </Button>
                            )}
                        </Space>
                    </Form.Item>
                )}
            </Form>
        </div>
    );
};

export default ContextForm;