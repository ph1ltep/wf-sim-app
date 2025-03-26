// src/components/forms/index.js
import React from 'react';
import { Form as AntForm } from 'antd';
import { FormActions, FormError, FormInfo } from './layouts';

// Export all form field components from fields.js
export * from './fields';

// Export all form layout components from layouts.js
export * from './layouts';

/**
 * Main Form component that provides a consistent wrapper for forms
 */
export const Form = ({
  children,
  onSubmit,
  onCancel,
  submitText,
  cancelText,
  submitDisabled,
  submitLoading,
  error,
  info,
  formInstance,
  layout = 'vertical',
  requiredMark = true,
  ...rest
}) => {
  return (
    <AntForm
      layout={layout}
      requiredMark={requiredMark}
      form={formInstance}
      onFinish={onSubmit}
      {...rest}
    >
      {error && <FormError message={error} />}
      {info && <FormInfo message={info} />}
      
      {children}
      
      {onSubmit && (
        <FormActions
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitText={submitText}
          cancelText={cancelText}
          submitDisabled={submitDisabled}
          submitLoading={submitLoading}
        />
      )}
    </AntForm>
  );
};