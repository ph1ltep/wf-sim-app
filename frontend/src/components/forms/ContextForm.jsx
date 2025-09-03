// src/components/forms/ContextForm.jsx - Enhanced with metrics support
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Button, Space, Modal, Alert, message } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateAffectedMetrics } from '../../utils/metricsUtils';
import { get } from 'lodash';

const { confirm } = Modal;

// Helper function to flatten nested objects for form field names
const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    Object.keys(obj || {}).forEach(key => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(flattened, flattenObject(value, newKey));
        } else {
            flattened[newKey] = value;
        }
    });
    return flattened;
};

// Helper function to unflatten form data back to nested structure
const unflattenObject = (flatObj) => {
    const result = {};
    
    for (const key in flatObj) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!current[k] || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = flatObj[key];
    }
    
    return result;
};

const ContextForm = ({
    path,
    onSubmit,
    onCancel,
    children,
    submitText = "Save",
    cancelText = "Cancel",
    showActions = true,
    confirmOnCancel = true,
    affectedMetrics = null, // New prop for form-level affected metrics
    ...formProps
}) => {
    const { getValueByPath, updateByPath, scenarioData } = useScenario();
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
        let initialValues = JSON.parse(JSON.stringify(initialValue));
        
        // Flatten nested objects for form field names (e.g., distribution.type)
        const flatInitialValues = flattenObject(initialValues);
        
        // Store original values for comparison, but use flattened for form
        initialValuesRef.current = initialValues;
        initialValues = flatInitialValues;

        console.log('ContextForm initializing with data:', {
            basePath,
            originalValue: initialValue,
            flattenedValues: initialValues,
            hasDistribution: !!initialValue.distribution
        });

        // ALWAYS reset form fields - this ensures clean state on reopen
        form.resetFields();
        form.setFieldsValue(initialValues);
        
        // Debug: Check what the form actually contains after setting values
        setTimeout(() => {
            const formValues = form.getFieldsValue();
            console.log('📋 Form populated with:', formValues);
        }, 100);

        // Reset all states to clean slate
        setHasUnsavedChanges(false);
        setValidationErrors([]);
        setLoading(false); // Ensure loading is reset here too
        setIsInitialized(true);
    }, [basePath, getValueByPath, form]);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        console.log('🔄 ContextForm resetForm called:', {
            hasInitialValues: !!initialValuesRef.current,
            initialValues: initialValuesRef.current
        });
        
        if (initialValuesRef.current) {
            form.resetFields();
            
            // Use the same flattening logic as initialization
            const flattenedInitialValues = flattenObject(initialValuesRef.current);
            console.log('🔄 ContextForm resetting with flattened values:', { 
                original: initialValuesRef.current,
                flattened: flattenedInitialValues 
            });
            
            form.setFieldsValue(flattenedInitialValues);
            setHasUnsavedChanges(false);
            setValidationErrors([]);
            setLoading(false); // Reset loading state
            console.log('🔄 ContextForm reset completed');
        } else {
            console.log('🔄 ContextForm no initial values, calling initializeForm');
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

    // Convert form values to full context paths for prospective changes
    const buildProspectiveChanges = useCallback((formValues) => {
        const prospectiveChanges = {};

        // Convert all form field values to full context paths
        const convertToFullPaths = (obj, currentPath = []) => {
            Object.keys(obj).forEach(key => {
                const fullPath = [...basePath, ...currentPath, key];
                const value = obj[key];

                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    // Nested object - recurse
                    convertToFullPaths(value, [...currentPath, key]);
                } else {
                    // Leaf value - add to prospective changes
                    prospectiveChanges[fullPath.join('.')] = value;
                }
            });
        };

        convertToFullPaths(formValues);
        return prospectiveChanges;
    }, [basePath]);

    // Handle form submission with proper Ant Design validation FIRST
    const handleFinish = async (values) => {
        console.log('💾 ContextForm Save Operation Started:', {
            path: basePath,
            formValues: values,
            initialValues: initialValuesRef.current,
            hasChanges: hasUnsavedChanges
        });
        
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

            // Convert flattened form values back to nested structure for saving
            const nestedValues = unflattenObject(values);
            console.log('💾 ContextForm converting form data:', { 
                flatValues: values,
                nestedValues: nestedValues 
            });
            
            // Prepare updates - nested form values + affected metrics
            let updates = { [basePath.join('.')]: nestedValues };

            // Calculate affected metrics if declared (form mode)
            if (affectedMetrics && affectedMetrics.length > 0) {
                const prospectiveChanges = buildProspectiveChanges(values);
                const metricUpdates = calculateAffectedMetrics(
                    affectedMetrics,
                    scenarioData,
                    prospectiveChanges
                );

                // Merge form update with metric updates
                updates = { ...updates, ...metricUpdates };
            }

            // Single batch updateByPath call with form + metrics
            console.log('💾 ContextForm calling updateByPath:', { updates });
            const result = await updateByPath(updates);
            console.log('💾 ContextForm updateByPath result:', result);

            if (result.isValid) {
                // Success path - update initial values with nested structure for future comparisons
                initialValuesRef.current = JSON.parse(JSON.stringify(nestedValues));
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
        console.log('❌ ContextForm Cancel clicked:', { 
            hasUnsavedChanges, 
            confirmOnCancel,
            initialValues: initialValuesRef.current,
            currentValues: form.getFieldsValue()
        });
        
        const performCancel = () => {
            console.log('❌ ContextForm performing cancel...');
            resetForm();
            if (onCancel) {
                onCancel();
            }
        };

        if (hasUnsavedChanges && confirmOnCancel) {
            console.log('❌ ContextForm showing cancel confirmation dialog...');
            confirm({
                title: 'Unsaved Changes',
                icon: <ExclamationCircleOutlined />,
                content: 'You have unsaved changes. Are you sure you want to cancel?',
                okText: 'Yes, Cancel',
                okType: 'danger',
                cancelText: 'Keep Editing',
                onOk: () => {
                    console.log('❌ ContextForm user confirmed cancel');
                    performCancel();
                },
                onCancel: () => {
                    console.log('❌ ContextForm user chose to keep editing');
                }
            });
        } else {
            performCancel();
        }
    }, [hasUnsavedChanges, confirmOnCancel, resetForm, onCancel, form]);

    // Handle reset with confirmation
    const handleReset = useCallback(() => {
        console.log('🔄 ContextForm Reset clicked:', { 
            hasUnsavedChanges,
            initialValues: initialValuesRef.current,
            currentValues: form.getFieldsValue()
        });
        
        if (hasUnsavedChanges) {
            console.log('🔄 ContextForm showing reset confirmation dialog...');
            confirm({
                title: 'Reset Form',
                icon: <ExclamationCircleOutlined />,
                content: 'This will reset all fields to their original values.',
                okText: 'Reset',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => {
                    console.log('🔄 ContextForm user confirmed reset');
                    resetForm();
                },
                onCancel: () => {
                    console.log('🔄 ContextForm user cancelled reset');
                }
            });
        } else {
            resetForm();
        }
    }, [hasUnsavedChanges, resetForm, form]);

    // Handle form value changes
    const handleValuesChange = useCallback((changedValues, allValues) => {
        if (!isInitialized || !initialValuesRef.current) {
            return;
        }

        // Flatten initial values for proper comparison with current form values
        const flattenedInitialValues = flattenObject(initialValuesRef.current);
        const hasChanges = JSON.stringify(allValues) !== JSON.stringify(flattenedInitialValues);
        
        // Debug unsaved changes detection
        if (hasChanges !== hasUnsavedChanges) {
            console.log('📝 ContextForm unsaved changes state changed:', {
                previousHasChanges: hasUnsavedChanges,
                newHasChanges: hasChanges,
                changedValues,
                allValues,
                initialValues: initialValuesRef.current
            });
        }
        
        setHasUnsavedChanges(hasChanges);

        // Clear validation errors when user starts editing
        if (validationErrors.length > 0) {
            setValidationErrors([]);
        }

        // Call parent's onValuesChange if provided
        if (formProps.onValuesChange) {
            formProps.onValuesChange(changedValues, allValues);
        }
    }, [isInitialized, validationErrors.length, formProps, hasUnsavedChanges]);

    // Value getter for ContextFields in form mode
    const getFormValue = useCallback((fieldPath, defaultValue = null) => {
        if (!isInitialized) return defaultValue;

        const relativePath = getRelativeFieldPath(fieldPath);

        if (relativePath.length === 1) {
            return form.getFieldValue(relativePath[0]) ?? defaultValue;
        }

        if (relativePath.length > 1) {
            const allValues = form.getFieldsValue();
            const value = get(allValues, relativePath, defaultValue);
            
            // Only log when form data is empty (debugging issue)
            if (Object.keys(allValues).length === 0 && relativePath.includes('type')) {
                console.log('⚠️ Form empty but requesting:', { relativePath, defaultValue });
            }
            
            return value;
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
            
            // Log important updates (debug mode only)
            if (relativePath.includes('type') && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
                console.log('📝 Updating distribution type:', { relativePath, value });
            }

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

    // Recursively traverse and enhance components
    const enhanceChild = (child) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        // Check if this component has a path prop (ContextField or DistributionFieldV3)
        const hasPath = child.props && child.props.path !== undefined;
        
        const isContextField = child.type && (
            child.type.name === 'ContextField' ||
            child.type.displayName === 'ContextField' ||
            child.type.name === 'DistributionFieldV3' ||
            child.type.displayName === 'DistributionFieldV3' ||
            hasPath
        );

        // Only log when enhancing components for form mode (debug mode only)
        if (isContextField && hasPath && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
            console.log(`🔧 ContextForm enhancing ${child.type?.name}:`, child.props?.path);
        }

        if (isContextField && hasPath) {
            // Convert relative paths to absolute paths within the form context
            let absolutePath = child.props.path;
            
            // If the path is a simple string and doesn't start with the basePath, make it absolute
            if (typeof absolutePath === 'string' && !absolutePath.includes('.')) {
                absolutePath = [...basePath, absolutePath];
            } else if (Array.isArray(absolutePath) && absolutePath.length > 0) {
                // Check if this path is already absolute or needs basePath prepending
                const pathStart = absolutePath.slice(0, basePath.length);
                const isAlreadyAbsolute = basePath.every((segment, index) => segment === pathStart[index]);
                
                if (!isAlreadyAbsolute) {
                    absolutePath = [...basePath, ...absolutePath];
                }
            }
            
            const relativePath = getRelativeFieldPath(absolutePath);
            const fieldName = relativePath.join('.');
            
            // Get the actual data at the absolute path for verification
            const absolutePathData = getValueByPath(absolutePath);
            
            // Only log if this is DistributionFieldV3 (debug mode only)
            if (child.type?.name === 'DistributionFieldV3' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
                console.log('📊 DistributionFieldV3 data:', { absolutePath, absolutePathData });
            }

            return React.cloneElement(child, {
                formMode: true,
                getValueOverride: getFormValue,
                updateValueOverride: updateFormValue,
                name: fieldName,
                path: absolutePath  // Pass the absolute path
            });
        }

        // Recursively process children even if this component doesn't need enhancement
        if (child.props && child.props.children) {
            const enhancedChildren = React.Children.map(child.props.children, enhanceChild);
            return React.cloneElement(child, {}, enhancedChildren);
        }

        return child;
    };

    // Clone children with form props
    const renderChildren = () => {
        if (!isInitialized) return null;
        return React.Children.map(children, enhanceChild);
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