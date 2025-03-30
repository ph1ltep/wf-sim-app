// src/components/forms/UnsavedChangesIndicator.jsx
import React from 'react';
import { Tag, Tooltip, Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const UnsavedChangesIndicator = ({ isDirty, onSave, size = 'small' }) => {
  if (!isDirty) return null;
  
  return (
    <Tooltip title="You have unsaved changes">
      <Tag 
        color="warning" 
        style={{ 
          marginLeft: 8,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onClick={onSave}
      >
        <SaveOutlined /> Unsaved Changes
      </Tag>
    </Tooltip>
  );
};

export default UnsavedChangesIndicator;