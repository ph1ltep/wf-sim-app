// src/components/contextFields/layouts.js
import React from 'react';
import { Card, Row, Col, Divider } from 'antd';

/**
 * Form section component that wraps fields in a card
 */
export const FormSection = ({ 
  title, 
  subtitle, 
  children, 
  extra,
  variant = 'outlined',
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

// Export the layout components
export default {
  FormSection,
  FormRow,
  FormCol,
  FormDivider
};