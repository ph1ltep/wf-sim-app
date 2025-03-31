import React from 'react';
import { Modal, Space, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * Reusable confirmation modal component
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility state
 * @param {function} props.onConfirm - Confirm action handler
 * @param {function} props.onCancel - Cancel action handler
 * @param {string} props.title - Modal title
 * @param {string|React.ReactNode} props.content - Modal content
 * @param {boolean} props.loading - Loading state
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {string} props.type - Modal type (info, warning, error, success)
 */
const ConfirmationModal = ({
  open,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  content = 'Are you sure you want to proceed?',
  loading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  width = 420,
  ...rest
}) => {
  // Get icon and color based on type
  const getTypeProperties = () => {
    switch (type) {
      case 'error':
        return { color: '#ff4d4f', icon: <ExclamationCircleOutlined /> };
      case 'success':
        return { color: '#52c41a', icon: <ExclamationCircleOutlined /> };
      case 'info':
        return { color: '#1890ff', icon: <ExclamationCircleOutlined /> };
      case 'warning':
      default:
        return { color: '#faad14', icon: <ExclamationCircleOutlined /> };
    }
  };

  const { color, icon } = getTypeProperties();

  return (
    <Modal
      title={
        <Space>
          {React.cloneElement(icon, { style: { color } })}
          {title}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      ]}
      width={width}
      maskClosable={false}
      {...rest}
    >
      {content}
    </Modal>
  );
};

export default ConfirmationModal;