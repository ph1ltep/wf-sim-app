// src/components/forms/FormButtons.jsx
import React from 'react';
import { Button, Space } from 'antd';

const FormButtons = ({ 
    onSubmit, 
    onReset, 
    isDirty = false,
    submitText = 'Save Changes',
    resetText = 'Reset',
    style = {}
  }) => {
    const handleReset = () => {
      if (typeof onReset === 'function') {
        onReset();
      }
    };
  
    return (
      <div style={{ marginTop: 24, textAlign: 'right', ...style }}>
        <Space>
          <Button
            onClick={handleReset}  // Use our handler function
            disabled={!isDirty}
          >
            {resetText}
          </Button>
          <Button 
            type="primary"
            onClick={onSubmit}
            disabled={!isDirty}
          >
            {submitText}
          </Button>
        </Space>
      </div>
    );
  };

export default FormButtons;