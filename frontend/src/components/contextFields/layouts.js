// src/components/contextFields/layouts.jsx
import React from 'react';
import { Row, Col, Divider, Typography } from 'antd';

const { Title } = Typography;

/**
 * FormSection - A section container with optional title and extra content
 */
export const FormSection = ({ 
  title, 
  level = 4, 
  extra, 
  children, 
  style = {},
  compact = false,
  ...props 
}) => {
  // Debug border styling - controlled by environment variable
  const getDebugStyle = () => {
    const baseStyle = compact ? { 
      padding: '8px', 
      margin: '4px 0' 
    } : { 
      padding: '12px', 
      margin: '8px 0' 
    };

    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
      return {
        ...baseStyle,
        border: '2px solid #722ed1',
        borderRadius: '6px',
        ...style
      };
    }
    return { ...baseStyle, ...style };
  };

  const titleMarginBottom = compact ? 8 : (extra ? 16 : 8);

  return (
    <div style={getDebugStyle()} {...props}>
      {title && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: titleMarginBottom
        }}>
          <Title level={level} style={{ margin: 0 }}>
            {title}
          </Title>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * FormRow - Layout row component with optional tighter spacing
 */
export const FormRow = ({ 
  children, 
  gutter = 16, 
  compact = false,
  ...props 
}) => {
  // Reduce gutter for compact mode
  const effectiveGutter = compact ? Math.max(8, gutter / 2) : gutter;
  
  // Debug border styling - controlled by environment variable
  const getDebugStyle = () => {
    const baseStyle = compact ? {
      padding: '3px',
      margin: '2px 0'
    } : {
      padding: '6px',
      margin: '3px 0'
    };

    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
      return {
        ...baseStyle,
        border: '1px solid #fa8c16',
        borderRadius: '3px'
      };
    }
    return baseStyle;
  };

  return (
    <div style={getDebugStyle()}>
      <Row gutter={effectiveGutter} {...props}>
        {children}
      </Row>
    </div>
  );
};

/**
 * FormCol - Layout column component
 */
export const FormCol = ({ 
  children, 
  span = 24,
  compact = false,
  ...props 
}) => {
  // Debug border styling - controlled by environment variable
  const getDebugStyle = () => {
    const baseStyle = compact ? {
      padding: '2px',
      margin: '1px'
    } : {
      padding: '4px',
      margin: '1px'
    };

    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
      return {
        ...baseStyle,
        border: '1px solid #13c2c2',
        borderRadius: '2px'
      };
    }
    return baseStyle;
  };

  return (
    <div style={getDebugStyle()}>
      <Col span={span} {...props}>
        {children}
      </Col>
    </div>
  );
};

/**
 * FormDivider - Styled divider with margin control
 */
export const FormDivider = ({ 
  margin = 'default',
  compact = false,
  ...props 
}) => {
  const getMarginStyle = () => {
    // Reduce margins in compact mode
    const multiplier = compact ? 0.5 : 1;
    
    switch (margin) {
      case 'small': return { margin: `${8 * multiplier}px 0` };
      case 'large': return { margin: `${32 * multiplier}px 0` };
      case 'none': return { margin: 0 };
      default: return { margin: `${16 * multiplier}px 0` };
    }
  };

  return (
    <Divider 
      style={getMarginStyle()} 
      {...props} 
    />
  );
};