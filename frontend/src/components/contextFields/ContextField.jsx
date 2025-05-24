// src/components/contextFields/ContextField.jsx - Simplified using Ant Design's built-in validation
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Form } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

// Enhanced ContextField with automatic path mapping and context isolation
export const ContextField = ({
  // Context-specific props (not passed to Form.Item)
  path,
  component: Component,
  transform,
  defaultValue,
  formMode = false,
  getValueOverride = null,
  updateValueOverride = null,
  validators = [],
  name, // Form.Item name for Ant Design integration
  children, // Add children prop

  // Form.Item props that we handle specially
  label,
  tooltip,
  required,
  disabled,

  // All other props are forwarded to Form.Item
  ...formItemProps
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const { getValueByPath, updateByPath } = useScenario();

  // Determine the effective path for this field
  const effectivePath = path;

  // Use form overrides when in form mode, or context functions otherwise
  const getValue = useCallback((fieldPath, fallback = null) => {
    if (formMode && getValueOverride) {
      return getValueOverride(fieldPath, fallback);
    }
    return getValueByPath(fieldPath, fallback);
  }, [formMode, getValueOverride, getValueByPath]);

  const updateValue = useCallback(async (fieldPath, value) => {
    if (formMode && updateValueOverride) {
      // In form mode, prevent any context updates
      return updateValueOverride(fieldPath, value);
    }
    // Only update context when not in form mode
    return updateByPath(fieldPath, value);
  }, [formMode, updateValueOverride, updateByPath]);

  // Get current value - handle initialization state
  const currentValue = getValue(effectivePath, null);

  // Determine effective value considering initialization
  const effectiveValue = isInitialized ? currentValue : (currentValue ?? defaultValue);

  // Handle change - let Ant Design handle validation display
  const handleChange = useCallback(async (newValue) => {
    // Apply transform function if provided
    const actualValue = transform ? transform(newValue) : (newValue && newValue.target ? newValue.target.value : newValue);

    // In form mode, skip all context validation - let Ant Design handle it
    if (formMode && updateValueOverride) {
      return updateValueOverride(effectivePath, actualValue);
    }

    // Non-form mode: Update context directly
    try {
      await updateValue(effectivePath, actualValue);
    } catch (error) {
      console.error('ContextField update error:', error);
    }
  }, [effectivePath, updateValueOverride, transform, formMode, updateValue]);

  // Enhanced default value initialization
  useEffect(() => {
    const initializeDefaultValue = async () => {
      // Prevent multiple initializations
      if (initializationRef.current) {
        return;
      }

      const needsInitialization =
        defaultValue !== undefined &&
        defaultValue !== null &&
        (currentValue === undefined || currentValue === null);

      if (needsInitialization && !formMode) {
        // Only initialize in non-form mode
        initializationRef.current = true;

        try {
          // Initialize the path with default value
          const result = await updateValue(effectivePath, defaultValue);

          if (result.isValid) {
            setIsInitialized(true);
          } else {
            // If initialization fails, still mark as initialized to prevent loops
            setIsInitialized(true);
            console.warn(`Failed to initialize default value for path ${Array.isArray(effectivePath) ? effectivePath.join('.') : effectivePath}:`, result.error);
          }
        } catch (error) {
          setIsInitialized(true);
          console.error(`Error initializing default value for path ${Array.isArray(effectivePath) ? effectivePath.join('.') : effectivePath}:`, error);
        }
      } else {
        // No initialization needed or in form mode
        setIsInitialized(true);
      }
    };

    // In form mode, skip default value initialization as the form handles initial values
    if (formMode) {
      setIsInitialized(true);
      return;
    }

    // Use requestAnimationFrame to ensure this runs after initial render
    const rafId = requestAnimationFrame(() => {
      initializeDefaultValue();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [effectivePath, defaultValue, currentValue, updateValue, formMode]);

  // Reset initialization state when path changes
  useEffect(() => {
    initializationRef.current = false;
    setIsInitialized(formMode); // In form mode, consider initialized immediately
  }, [effectivePath, formMode]);

  // Debug border support
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed red',
    padding: '2px',
    margin: '1px'
  } : {};

  // Handle required field validation display
  const effectiveRequired = required || (formItemProps.rules && formItemProps.rules.some(rule => rule.required));

  // Combine all Form.Item props - let Ant Design handle all validation display
  const finalFormItemProps = {
    label,
    tooltip,
    required: effectiveRequired,
    name: formMode ? name : undefined, // Only set name in form mode
    style: debugBorders ? { ...formItemProps.style, ...debugStyle } : formItemProps.style,
    ...formItemProps // All Ant Design props pass through unchanged
  };

  // Don't render until initialization is complete to avoid flicker (except in form mode)
  if (!isInitialized && !formMode) {
    return (
      <Form.Item {...finalFormItemProps}>
        <Component
          disabled={true}
          value={effectiveValue}
          onChange={() => { }} // No-op during initialization
          placeholder="Initializing..."
          {...(formItemProps.componentProps || {})}
        >
          {children}
        </Component>
      </Form.Item>
    );
  }

  return (
    <Form.Item {...finalFormItemProps}>
      <Component
        disabled={disabled}
        value={effectiveValue}
        onChange={handleChange}
        {...(formItemProps.componentProps || {})}
      >
        {children}
      </Component>
    </Form.Item>
  );
};