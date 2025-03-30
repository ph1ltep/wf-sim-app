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
  return (
    <div style={{ marginTop: 24, textAlign: 'right', ...style }}>
      <Space>
        <Button
          onClick={onReset}
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