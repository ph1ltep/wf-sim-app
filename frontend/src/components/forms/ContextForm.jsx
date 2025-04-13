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
        // Handle simple property name (without full path)
        if (typeof fieldPath === 'string' && !fieldPath.includes('.')) {
            return formState[fieldPath];
        }

        // Convert to array if string with dots
        const fieldPathArray = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');

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

        // Handle numeric indices in string form
        if (relativePath.length === 1 && !isNaN(Number(relativePath[0]))) {
            // It's a numeric index as string, convert to number for array access
            return formState;
        }

        return get(formState, relativePath);
    };

    // Field update handler
    const updateFormValue = (fieldPath, value) => {
        // Handle simple property name (without full path)
        if (typeof fieldPath === 'string' && !fieldPath.includes('.')) {
            setFormState(produce(formState, draft => {
                draft[fieldPath] = value;
            }));
            return { isValid: true, applied: true, value };
        }

        // Convert to array if string with dots
        const fieldPathArray = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');

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
                formMode: true,
                getValueOverride: getFormValue,
                updateValueOverride: updateFormValue
            });
        });
    };

    return (
        <Form
            onFinish={handleSubmit}
            layout={formProps.layout || "vertical"}
            {...formProps}
        >
            {renderChildren()}

            {showActions && (
                <Form.Item className="form-actions">
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
    );
};

export default ContextForm;