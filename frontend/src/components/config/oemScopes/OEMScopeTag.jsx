// src/components/config/oemScopes/OEMScopeTag.jsx
import React from 'react';

/**
 * Component to display a colored tag
 * Used in the OEM Scopes table for displaying scope features
 */
const OEMScopeTag = ({ children, color }) => {
  return (
    <span 
      style={{ 
        backgroundColor: color, 
        color: '#fff', 
        padding: '2px 8px', 
        borderRadius: '4px',
        display: 'inline-block',
        fontSize: '12px'
      }}
    >
      {children}
    </span>
  );
};

export default OEMScopeTag;