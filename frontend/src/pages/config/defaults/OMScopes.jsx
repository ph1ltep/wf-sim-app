// frontend/src/pages/config/defaults/OMScopes.jsx
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table } from 'antd';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';

// Custom hook for OEM scopes data management
import useOEMScopes from 'hooks/useOEMScopes';

// Component imports
import OEMScopeForm from 'components/forms/OMScopes/OEMScopeForm';
import OEMScopeDetails from 'components/forms/OMScopes/OEMScopeDetails';
import { getOEMScopeColumns } from 'components/forms/OMScopes/oemScopeColumns';
//import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;

const OEMScopes = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [currentScope, setCurrentScope] = useState({});

  // Use the custom hook for OEM scopes data and operations
  const {
    oemScopes,
    loading,
    generateNameLoading,
    createScope,
    updateScope,
    deleteScope,
    generateName
  } = useOEMScopes();

  // Handle opening the form modal for adding a new scope
  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      technicianPercent: 100 // Set default value for the technician percent
    });
    setCurrentScope({});
    setFormType('add');
    setModalVisible(true);
  };

  // Handle opening the form modal for editing an existing scope
  const handleEdit = (record) => {
    setCurrentScope(record);
    setFormType('edit');
    setModalVisible(true);
  };

  // Handle deleting a scope
  const handleDelete = async (id) => {
    await deleteScope(id);
  };

  // Handle generating a name based on form values
  const handleGenerateName = async () => {
    const values = form.getFieldsValue();
    const result = await generateName(values);
    if (result.success) {
      form.setFieldsValue({ name: result.name });
    }
  };

  // Handle saving the form data
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (formType === 'add') {
        await createScope(values);
      } else {
        await updateScope(currentScope.key, values);
      }

      setModalVisible(false);
    } catch (error) {
      // Form validation error - no action needed as the form will show error messages
      console.error('Validation failed:', error);
    }
  };

  // Handle cancelling form editing
  const handleCancel = () => {
    setModalVisible(false);
  };

  // Get table columns with handler functions
  const columns = getOEMScopeColumns(handleEdit, handleDelete);

  return (
    <div>
      <Title level={2}>OEM Scope Definitions</Title>
      <p>Manage OEM scope definitions for wind farm maintenance contracts.</p>

      <Card
        title={
          <span>
            <ToolOutlined style={{ marginRight: 8 }} />
            OEM Scope Definitions
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add OEM Scope
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={oemScopes}
          rowKey="key"
          pagination={{ pageSize: 10 }}
          loading={loading}
          expandable={{
            expandedRowRender: record => <OEMScopeDetails record={record} />,
          }}
        />
      </Card>

      <Modal
        title={formType === 'add' ? 'Add OEM Scope' : 'Edit OEM Scope'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSave} loading={loading}>
            Save
          </Button>,
        ]}
      >
        <OEMScopeForm
          form={form}
          initialValues={currentScope}
          onGenerateName={handleGenerateName}
          generateNameLoading={generateNameLoading}
        />
      </Modal>
    </div>
  );
};

export default OEMScopes;