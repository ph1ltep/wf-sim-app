// src/components/forms/layouts.js
import React from 'react';
import { Card, Row, Col, Divider, Space, Button, Alert } from 'antd';

/**
 * Form section component that wraps fields in a card
 */
export const FormSection = ({ 
    title, 
    subtitle, 
    children, 
    extra,
    bordered, // Keep for backward compatibility
    variant = bordered === false ? 'borderless' : 'outlined',
    style = {},
    ...rest 
  }) => (
    <Card 
      title={title} 
      extra={extra}
      style={{ marginBottom: 24, ...style }}
      variant={variant}
      {...rest}
    >
      {subtitle && <p className="form-section-subtitle">{subtitle}</p>}
      {children}
    </Card>
  );

/**
 * Form divider with optional title
 */
export const FormDivider = ({ 
  title, 
  orientation = 'left',
  ...rest 
}) => (
  <Divider 
    orientation={orientation}
    {...rest}
  >
    {title}
  </Divider>
);

/**
 * Form row with columns for field layout
 */
export const FormRow = ({ 
  children, 
  gutter = 24,
  ...rest 
}) => (
  <Row 
    gutter={gutter}
    {...rest}
  >
    {React.Children.map(children, child => {
      // If child already has a Col wrapper, return as is
      if (child && child.type === Col) {
        return child;
      }
      // Otherwise wrap with a Col
      return <Col span={24}>{child}</Col>;
    })}
  </Row>
);

/**
 * Form column component for consistent layouts
 */
export const FormCol = ({ 
  children, 
  span = 24,
  xs = 24,
  sm,
  md,
  lg,
  xl,
  ...rest 
}) => (
  <Col 
    span={span}
    xs={xs}
    sm={sm || (span < 24 ? span : 24)}
    md={md || span}
    lg={lg || span}
    xl={xl || span}
    {...rest}
  >
    {children}
  </Col>
);

/**
 * Form actions component for submit/cancel buttons
 */
export const FormActions = ({ 
  onSubmit, 
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitDisabled = false,
  submitLoading = false,
  align = 'right',
  style = {},
  ...rest 
}) => (
  <div 
    style={{ 
      marginTop: 24, 
      textAlign: align,
      ...style 
    }}
    {...rest}
  >
    <Space>
      {onCancel && (
        <Button onClick={onCancel}>
          {cancelText}
        </Button>
      )}
      <Button 
        type="primary" 
        onClick={onSubmit}
        disabled={submitDisabled}
        loading={submitLoading}
        htmlType="submit"
      >
        {submitText}
      </Button>
    </Space>
  </div>
);

/**
 * Form error message component
 */
export const FormError = ({ 
  message,
  description,
  ...rest 
}) => (
  message ? (
    <Alert
      message={message}
      description={description}
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
      {...rest}
    />
  ) : null
);

/**
 * Form info message component
 */
export const FormInfo = ({ 
  message,
  description,
  ...rest 
}) => (
  message ? (
    <Alert
      message={message}
      description={description}
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      {...rest}
    />
  ) : null
);

/**
 * Conditional form field wrapper
 */
export const FormCondition = ({ 
  when,
  is,
  children,
  otherwise = null
}) => {
  // Simple equality check
  if (when === is) {
    return children;
  }
  
  // If 'is' is a function, use it as a predicate
  if (typeof is === 'function' && is(when)) {
    return children;
  }
  
  // Handle array of possible values
  if (Array.isArray(is) && is.includes(when)) {
    return children;
  }
  
  return otherwise;
};