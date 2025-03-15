// frontend/src/components/config/OEMContracts.jsx
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table } from 'antd';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';

// Custom hook for OEM contracts data management
import useOEMContracts from '../../hooks/useOEMContracts';

// Component imports
import OEMContractForm from './oemContracts/OEMContractForm';
import { getOEMContractColumns } from './oemContracts/oemContractColumns';

const { Title } = Typography;

const OEMContracts = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [currentContract, setCurrentContract] = useState({});
  
  // Use the custom hook for OEM contracts data and operations
  const { 
    oemContracts, 
    oemScopes,
    loading, 
    createContract,
    updateContract,
    deleteContract
  } = useOEMContracts();
  
  // Handle opening the form modal for adding a new contract
  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      startYear: 1,
      endYear: 5,
      isPerTurbine: true
    });
    setCurrentContract({});
    setFormType('add');
    setModalVisible(true);
  };
  
  // Handle opening the form modal for editing an existing contract
  const handleEdit = (record) => {
    setCurrentContract(record);
    setFormType('edit');
    setModalVisible(true);
  };
  
  // Handle deleting a contract
  const handleDelete = async (id) => {
    await deleteContract(id);
  };
  
  // Handle saving the form data
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (formType === 'add') {
        await createContract(values);
      } else {
        await updateContract(currentContract.key, values);
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };
  
  // Handle cancelling form editing
  const handleCancel = () => {
    setModalVisible(false);
  };
  
  // Get table columns with handler functions
  const columns = getOEMContractColumns(handleEdit, handleDelete);

  return (
    <div>
      <Title level={2}>OEM Contract Terms</Title>
      <p>Manage OEM contract terms for wind farm maintenance.</p>
      
      <Card 
        title={
          <span>
            <ToolOutlined style={{ marginRight: 8 }} />
            OEM Contract Terms
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add OEM Contract
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table 
          columns={columns} 
          dataSource={oemContracts} 
          rowKey="key"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>
      
      <Modal
        title={formType === 'add' ? 'Add OEM Contract' : 'Edit OEM Contract'}
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
        <OEMContractForm
          form={form}
          initialValues={currentContract}
          oemScopes={oemScopes}
        />
      </Modal>
    </div>
  );
};

export default OEMContracts;