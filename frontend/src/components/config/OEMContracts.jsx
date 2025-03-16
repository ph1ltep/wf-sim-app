// frontend/src/components/config/OEMContracts.jsx
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table, message, Space } from 'antd';
import { PlusOutlined, ToolOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/ScenarioContext';

// Component imports
import OEMContractForm from './oemContracts/OEMContractForm';

const { Title } = Typography;

const OEMContracts = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [editIndex, setEditIndex] = useState(-1);
  
  // Use the simulation context to get/update parameters
  const { parameters, updateModuleParameters, loading } = useSimulation();
  
  // Get OEM contracts from parameters
  const oemContracts = parameters?.oemContracts || [];
  
  // Get OEM scopes from parameters
  const oemScopes = parameters?.oemScopes || [];

  // Handle opening the form modal for adding a new contract
  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      startYear: 1,
      endYear: 5,
      isPerTurbine: true
    });
    setEditIndex(-1);
    setFormType('add');
    setModalVisible(true);
  };
  
  // Handle opening the form modal for editing an existing contract
  const handleEdit = (index) => {
    form.setFieldsValue(oemContracts[index]);
    setEditIndex(index);
    setFormType('edit');
    setModalVisible(true);
  };
  
  // Handle deleting a contract
  const handleDelete = (index) => {
    // Check if this contract is referenced in the cost module
    if (parameters?.cost?.oemContractId === oemContracts[index]?.id) {
      // Clear the reference in the cost module
      updateModuleParameters('cost', {
        ...parameters.cost,
        oemContractId: null
      });
    }
    
    // Remove the contract from the array
    const updatedContracts = [...oemContracts];
    updatedContracts.splice(index, 1);
    
    // Update parameters
    updateModuleParameters('oemContracts', updatedContracts);
    message.success('Contract removed');
  };
  
  // Handle saving the form data
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Generate a unique ID if this is a new contract
      if (formType === 'add') {
        // Generate a random ID for new contracts
        values.id = `contract_${Date.now()}`;
        
        // Add the new contract to the array
        const updatedContracts = [...oemContracts, values];
        updateModuleParameters('oemContracts', updatedContracts);
        message.success('Contract added');
      } else {
        // Update the existing contract
        const updatedContracts = [...oemContracts];
        updatedContracts[editIndex] = {
          ...updatedContracts[editIndex],
          ...values
        };
        updateModuleParameters('oemContracts', updatedContracts);
        message.success('Contract updated');
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
  
  // Set as active contract in cost module
  const setAsActiveContract = (contract) => {
    updateModuleParameters('cost', {
      ...parameters?.cost,
      oemContractId: contract.id,
      oemTerm: contract.endYear, // Update OEM term to match contract end year
      fixedOMFee: contract.isPerTurbine ? 
        contract.fixedFee * parameters.general.numWTGs : 
        contract.fixedFee
    });
    message.success('Set as active contract in Cost module');
  };
  
  // Define table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Term',
      key: 'term',
      render: (_, record) => (
        <span>Year {record.startYear} - {record.endYear}</span>
      ),
    },
    {
      title: 'Fixed Fee',
      key: 'fixedFee',
      render: (_, record) => (
        <span>
          ${record.fixedFee.toLocaleString()}{record.isPerTurbine ? '/WTG' : ''}/year
        </span>
      ),
    },
    {
      title: 'OEM Scope',
      dataIndex: 'oemScopeName',
      key: 'oemScope',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        parameters?.cost?.oemContractId === record.id ? 
          <span style={{ color: 'green' }}>Active in Cost Module</span> : 
          <span>-</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, index) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(index)}
          >
            Edit
          </Button>
          
          <Button
            size="small"
            onClick={() => setAsActiveContract(record)}
            disabled={parameters?.cost?.oemContractId === record.id}
          >
            Set as Active
          </Button>
          
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(index)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

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
          rowKey="id"
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
          oemScopes={oemScopes}
        />
      </Modal>
    </div>
  );
};

export default OEMContracts;