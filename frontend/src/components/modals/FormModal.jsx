import React from 'react';
import { Modal } from 'antd';
import { Form } from '../forms';

/**
 * Modal wrapper for Form component
 */
const FormModal = ({
  open,
  onCancel,
  title,
  children,
  width = 520,
  ...formProps
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      width={width}
    >
      <Form {...formProps}>
        {children}
      </Form>
    </Modal>
  );
};

export default FormModal;