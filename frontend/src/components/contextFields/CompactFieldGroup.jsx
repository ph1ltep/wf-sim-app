// src/components/contextFields/CompactFieldGroup.jsx
import React from 'react';
import { Space } from 'antd';

/**
 * CompactFieldGroup - A wrapper component for grouping related fields in inline layout
 * Useful for creating compact forms with logically grouped fields
 */
export const CompactFieldGroup = ({
  children,
  direction = 'horizontal',
  size = 'small',
  wrap = true,
  align = 'flex-start', // Changed from 'baseline' to 'flex-start' for better alignment
  style = {},
  equalWidth = false, // New prop to make all fields equal width
  ...props
}) => {
  // Debug border styling - controlled by environment variable
  const getDebugStyle = () => {
    const baseStyle = {
      padding: '4px',
      margin: '2px 0',
      width: '100%', // Ensure the group takes full width
      ...style
    };

    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true') {
      return {
        ...baseStyle,
        border: '1px dashed #eb2f96',
        borderRadius: '4px'
      };
    }
    return baseStyle;
  };

  // Clone children and pass compact mode to them
  const renderChildren = () => {
    const childrenArray = React.Children.toArray(children);
    
    return childrenArray.map((child, index) => {
      if (!React.isValidElement(child)) {
        return child;
      }

      // Calculate flex properties for equal width distribution
      const childStyle = equalWidth && direction === 'horizontal' 
        ? { 
            flex: `1 1 ${100 / childrenArray.length}%`,
            minWidth: 0 // Allow shrinking
          }
        : { 
            flex: direction === 'horizontal' ? '0 0 auto' : '1 1 auto' // Auto-size based on content
          };

      // Clone the element with form props
      return React.cloneElement(child, {
        key: child.key || index,
        compact: true,
        //layout: 'horizontal', // Force horizontal layout for grouped fields
        formItemStyle: {
          marginBottom: 8, // Reduced margin for compact group
          ...(child.props.formItemStyle || {}),
          ...childStyle
        },
        ...child.props // This preserves formMode, getValueOverride, updateValueOverride
      });
    });
  };

  // Use flexbox directly instead of Ant Design Space for better control
  if (direction === 'horizontal') {
    return (
      <div style={getDebugStyle()}>
        <div
          style={{
            display: 'flex',
            flexWrap: wrap ? 'wrap' : 'nowrap',
            gap: size === 'small' ? '8px' : size === 'middle' ? '16px' : '24px',
            alignItems: align,
            width: '100%'
          }}
          {...props}
        >
          {renderChildren()}
        </div>
      </div>
    );
  }

  // Fallback to Space for vertical direction
  return (
    <div style={getDebugStyle()}>
      <Space
        direction={direction}
        size={size}
        wrap={wrap}
        align={align}
        style={{ width: '100%' }}
        {...props}
      >
        {renderChildren()}
      </Space>
    </div>
  );
};

export default CompactFieldGroup;