// src/components/contextFields/ContextField.jsx - Modified version
import React, { useState, useCallback, useEffect } from 'react';
import { Form, Tooltip } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

// Enhanced ContextField with formMode and layout support
export const ContextField = ({
  path,
  label,
  component: Component,
  tooltip,
  required,
  disabled,
  validators = [], // Custom validators
  transform, // Optional transform function for the input value
  defaultValue, // Added explicit support for defaultValue

  // New props for form mode
  formMode = false,
  getValueOverride = null,
  updateValueOverride = null,

  // New props for layout support
  layout,
  compact = false,
  responsive = false,
  formItemStyle = {},

  ...rest
}) => {
  const [error, setError] = useState(null);
  const { getValueByPath, updateByPath } = useScenario();

  // Use provided overrides when in form mode, or context functions otherwise
  const getValue = formMode && getValueOverride ? getValueOverride : getValueByPath;
  const updateValue = formMode && updateValueOverride ? updateValueOverride : updateByPath;

  // Get current value using the correct path handling
  console.log('ContextField - formMode:', formMode, 'path:', path);
  const value = getValue(path, null);
  console.log('ContextField - got value:', value);

  // Handle change with validation
  const handleChange = useCallback(async (newValue) => {
    // Apply transform function if provided (e.g., for checkbox which returns event)
    const actualValue = transform ? transform(newValue) : (newValue && newValue.target ? newValue.target.value : newValue);

    // Use the appropriate update method
    const result = await updateValue(path, actualValue);

    if (!result.isValid) {
      setError(result.error);
    } else {
      setError(null);
    }

    return result;
  }, [path, updateValue, transform]);

  // Initialize with defaultValue if current value is null/undefined and defaultValue is provided
  useEffect(() => {
    const shouldInitialize =
      defaultValue !== undefined &&
      defaultValue !== null &&
      (value === undefined || value === null);

    if (shouldInitialize && !disabled) {
      // Use a small timeout to ensure this doesn't interfere with other initialization
      const timeoutId = setTimeout(() => {
        handleChange(defaultValue);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [defaultValue, value, handleChange, disabled]);

  // Simplified label rendering - no truncation
  const renderLabel = () => {
    return label;
  };

  // Debug border styling - controlled by environment variable
  const getDebugStyle = () => {
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
      return {
        ...formItemStyle,
        border: '1px solid #52c41a',
        borderRadius: '2px',
        padding: '4px',
        margin: '2px 0'
      };
    }
    return formItemStyle;
  };

  // Custom horizontal layout for better control
  if (layout === 'horizontal') {
    const containerStyle = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: compact ? '12px' : '16px',
      width: '100%', // Ensure full width usage
      ...getDebugStyle()
    };

    const labelStyle = {
      flexShrink: 0,
      paddingTop: '4px', // Align with input field
      paddingRight: '8px',
      fontSize: '14px',
      lineHeight: '1.5',
      color: error ? '#ff4d4f' : undefined,
      // Removed whiteSpace: 'nowrap' to allow natural wrapping
      wordBreak: 'break-word', // Allow breaking long words if needed
      minWidth: 'auto' // Let label size naturally
    };

    const fieldContainerStyle = {
      flex: 1,
      minWidth: 0, // Allow shrinking below content size
      width: '100%' // Ensure field container takes available space
    };

    const requiredStyle = required ? {
      color: '#ff4d4f',
      fontSize: '14px',
      fontFamily: 'SimSun, sans-serif',
      lineHeight: 1,
      content: '*'
    } : {};

    return (
      <div style={containerStyle}>
        {label && (
          <div style={labelStyle}>
            {required && <span style={requiredStyle}>* </span>}
            {tooltip ? (
              <Tooltip title={tooltip}>
                <span style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                  {renderLabel()}
                </span>
              </Tooltip>
            ) : (
              renderLabel()
            )}
          </div>
        )}
        <div style={fieldContainerStyle}>
          <Component 
            disabled={disabled}
            value={value}
            onChange={handleChange}
            status={error ? 'error' : undefined}
            style={{ width: '100%' }}
            {...rest}
          />
          {error && (
            <div style={{ 
              color: '#ff4d4f', 
              fontSize: '12px', 
              marginTop: '4px',
              lineHeight: '1.5'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default vertical layout using Form.Item
  return (
    <Form.Item
      label={renderLabel()}
      tooltip={tooltip}
      validateStatus={error ? 'error' : undefined}
      help={error}
      required={required}
      style={getDebugStyle()}
    >
      <Component disabled={disabled}
        value={value}
        onChange={handleChange}
        status={error ? 'error' : undefined}
        {...rest}
      />
    </Form.Item>
  );
};