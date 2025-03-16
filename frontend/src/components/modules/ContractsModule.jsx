// src/components/modules/Contracts.jsx
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table, message } from 'antd';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

// Component imports
import ContractForm from './Contracts/ContractForm';
import { getOEMContractColumns } from './Contracts/contractColumns';
import useOEMScopes from '../../hooks/useOEMScopes';

const { Title } = Typography;

const Contracts = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [currentContract, setCurrentContract] = useState({});
  
  // Use the scenario context
  const { settings, loading, updateScenario, scenarioData } = useScenario();
  
  // Use custom hook to fetch OEM scopes
  const { oemScopes, loading: loadingScopes } = useOEMScopes();
  
  // Get OEM contracts from scenario settings
  const oemContracts = settings?.modules?.contracts?.oemContracts || [];

  // Handle opening the form modal for adding a new contract
  const handleAdd = () => {
    form.resetFields();
    
    // Initialize with default values
    form.setFieldsValue({
      years: [1, 2, 3, 4, 5], // Default to years 1-5
      isPerTurbine: true,
      fixedFee: 100000
    });
    
    setCurrentContract({});
    setFormType('add');
    setModalVisible(true);
  };
  
  // Handle opening the form modal for editing an existing contract
  const handleEdit = (record) => {
    setCurrentContract(record);
    
    // Handle conversion of startYear/endYear to years array if necessary
    let formData = { ...record };
    
    // If old format with startYear/endYear but no years array
    if ((record.startYear || record.endYear) && !record.years) {
      const start = record.startYear || 1;
      const end = record.endYear || start;
      formData.years = Array.from(
        { length: end - start + 1 }, 
        (_, i) => start + i
      );
    }
    
    form.setFieldsValue(formData);
    setFormType('edit');
    setModalVisible(true);
  };
  
  // Handle deleting a contract
  const handleDelete = async (id) => {
    // Create updated settings
    const updatedSettings = { ...settings };
    
    // Ensure the path exists
    if (!updatedSettings.modules) updatedSettings.modules = {};
    if (!updatedSettings.modules.contracts) updatedSettings.modules.contracts = {};
    if (!updatedSettings.modules.contracts.oemContracts) {
      updatedSettings.modules.contracts.oemContracts = [];
    }
    
    // Remove the contract from the array
    updatedSettings.modules.contracts.oemContracts = 
      oemContracts.filter(contract => contract.id !== id);
    
    // Update the scenario with new settings
    await updateScenario(scenarioData._id, { settings: updatedSettings });
    message.success('Contract removed');
  };
  
  // Handle saving the form data
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Create updated settings
      const updatedSettings = { ...settings };
      
      // Ensure contracts array exists
      if (!updatedSettings.modules) updatedSettings.modules = {};
      if (!updatedSettings.modules.contracts) updatedSettings.modules.contracts = {};
      if (!updatedSettings.modules.contracts.oemContracts) {
        updatedSettings.modules.contracts.oemContracts = [];
      }
      
      // If we have oemScopeId, get the name from the scopes list
      if (values.oemScopeId) {
        const selectedScope = oemScopes.find(scope => scope.key === values.oemScopeId);
        if (selectedScope) {
          values.oemScopeName = selectedScope.name;
        }
      }
      
      if (formType === 'add') {
        // Generate a unique ID for new contracts
        values.id = `contract_${Date.now()}`;
        
        // Add the new contract to the array
        updatedSettings.modules.contracts.oemContracts = [
          ...updatedSettings.modules.contracts.oemContracts,
          values
        ];
        
        message.success('Contract added');
      } else {
        // Update the existing contract
        updatedSettings.modules.contracts.oemContracts = 
          updatedSettings.modules.contracts.oemContracts.map(contract => 
            contract.id === currentContract.id ? { ...contract, ...values } : contract
          );
        
        message.success('Contract updated');
      }
      
      // Update the scenario with new settings
      await updateScenario(scenarioData._id, { settings: updatedSettings });
      
      setModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };
  
  // Handle cancelling form editing
  const handleCancel = () => {
    setModalVisible(false);
  };
  
  // Get columns with handler functions
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
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading || loadingScopes}
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
        <ContractForm
          form={form}
          oemScopes={oemScopes.map(scope => ({
            id: scope.key,
            name: scope.name
          }))}
        />
      </Modal>
    </div>
  );
};

export default Contracts;