// src/components/modules/ContractsModule.jsx - fix for missing updateModuleParameters
import React, { useState, useEffect } from 'react';
import { Typography, Form, Card, Button, Modal, Table, message, Alert, Space } from 'antd';
import { PlusOutlined, ToolOutlined, ReloadOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

// Component imports
import ContractForm from './Contracts/ContractForm';
import { getOEMContractColumns } from './Contracts/contractColumns';
import useOEMScopes from '../../hooks/useOEMScopes';

const { Title } = Typography;

const ContractsModule = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add');
  const [currentContract, setCurrentContract] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scopesFetched, setScopesFetched] = useState(false);
  
  // Use the scenario context - get what we need
  const { scenarioData, setScenarioData } = useScenario();
  
  // Use custom hook to fetch OEM scopes
  const { oemScopes, loading: loadingScopes, fetchOEMScopes } = useOEMScopes();
  
  // Get OEM contracts directly from scenarioData
  const settings = scenarioData?.settings || {};
  const oemContracts = settings?.modules?.contracts?.oemContracts || [];
  
  // Map OEM scopes for the form
  const mappedScopes = oemScopes.map(scope => ({
    id: scope.value || scope.key,
    name: scope.label || scope.name
  }));

  // Fetch OEM scopes only once on component mount
  useEffect(() => {
    if (!scopesFetched) {
      fetchOEMScopes().then(() => {
        setScopesFetched(true);
      });
    }
  }, [fetchOEMScopes, scopesFetched]);

  // Update the contracts in the local state
  const updateContracts = (updatedContracts) => {
    // Create a deep copy of the current scenarioData
    const updatedScenario = JSON.parse(JSON.stringify(scenarioData));
    
    // Ensure the path exists
    if (!updatedScenario.settings) updatedScenario.settings = {};
    if (!updatedScenario.settings.modules) updatedScenario.settings.modules = {};
    if (!updatedScenario.settings.modules.contracts) updatedScenario.settings.modules.contracts = {};
    
    // Update the contracts array
    updatedScenario.settings.modules.contracts.oemContracts = updatedContracts;
    
    // Update the scenario data in context
    setScenarioData(updatedScenario);
  };

  // Handle opening the form modal for adding a new contract
  const handleAdd = () => {
    form.resetFields();
    
    // Initialize with default values
    form.setFieldsValue({
      years: [1, 2, 3, 4, 5],
      isPerTurbine: true,
      fixedFee: 100000
    });
    
    setCurrentContract({});
    setFormType('add');
    setModalVisible(true);
  };
  
  // Handle opening the form modal for editing an existing contract
  const handleEdit = (record) => {
    console.log("Editing contract:", record);
    setCurrentContract(record);
    
    form.setFieldsValue(record);
    setFormType('edit');
    setModalVisible(true);
  };
  
  // Handle deleting a contract - only updates context, doesn't save to server
  const handleDelete = (id) => {
    try {
      setLocalLoading(true);
      
      if (!scenarioData || !scenarioData._id) {
        message.error('No active scenario. Please create or load a scenario first.');
        return;
      }
      
      // Filter out the contract to delete
      const updatedContracts = oemContracts.filter(contract => contract.id !== id);
      
      // Update the contracts in the local state
      updateContracts(updatedContracts);
      
      message.success('Contract removed - Remember to save the scenario to persist changes');
    } catch (error) {
      console.error('Error removing contract:', error);
      setError('Failed to remove contract: ' + (error.message || 'Unknown error'));
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Handle saving the form data - only updates context, doesn't save to server
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLocalLoading(true);
      
      if (!scenarioData || !scenarioData._id) {
        message.error('No active scenario. Please create or load a scenario first.');
        return;
      }
      
      // Prepare the contract data
      const contractData = {
        id: formType === 'add' ? `contract_${Date.now()}` : currentContract.id,
        name: values.name,
        years: values.years || [],
        fixedFee: Number(values.fixedFee) || 0,
        isPerTurbine: !!values.isPerTurbine,
        oemScopeId: values.oemScopeId || null
      };
      
      // If we have oemScopeId, get the name from the scopes list
      if (contractData.oemScopeId) {
        const selectedScope = mappedScopes.find(scope => scope.id === contractData.oemScopeId);
        if (selectedScope) {
          contractData.oemScopeName = selectedScope.name;
        }
      }
      
      console.log("Contract data to save:", contractData);
      
      // Create updated contracts array
      let updatedContracts;
      
      if (formType === 'add') {
        // Add the new contract to the array
        updatedContracts = [...oemContracts, contractData];
      } else {
        // Update the existing contract
        updatedContracts = oemContracts.map(contract => 
          contract.id === currentContract.id ? contractData : contract
        );
      }
      
      // Update the contracts in the local state
      updateContracts(updatedContracts);
      
      message.success(`Contract ${formType === 'add' ? 'added' : 'updated'} - Remember to save the scenario to persist changes`);
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving contract:', error);
      setError('Failed to save contract: ' + (error.message || 'Unknown error'));
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Handle cancelling form editing
  const handleCancel = () => {
    setModalVisible(false);
  };
  
  // Handle manual refresh of OEM scopes
  const handleRefreshScopes = () => {
    fetchOEMScopes().then(() => {
      message.success("OEM scopes refreshed");
    }).catch(err => {
      message.error("Failed to refresh OEM scopes");
    });
  };

  // Get columns with handler functions
  const columns = getOEMContractColumns(handleEdit, handleDelete);
  
  // Check if there's an active scenario
  const noScenario = !scenarioData || !scenarioData._id;
  
  return (
    <div>
      <Title level={2}>OEM Contract Terms</Title>
      <p>Manage OEM contract terms for wind farm maintenance.</p>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {noScenario && (
        <Alert
          message="No Active Scenario"
          description="Please create or load a scenario first."
          type="warning"
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Alert
        message="Remember to Save"
        description="Changes to contracts are not automatically saved to the server. Click 'Save Scenario' in the top bar when you're done editing."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Card 
        title={
          <span>
            <ToolOutlined style={{ marginRight: 8 }} />
            OEM Contract Terms
          </span>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefreshScopes}
              loading={loadingScopes}
            >
              Refresh Scopes
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={localLoading || noScenario}
            >
              Add OEM Contract
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table 
          columns={columns} 
          dataSource={oemContracts} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={localLoading || loadingScopes}
          locale={{ emptyText: 'No OEM contracts defined for this scenario' }}
        />
      </Card>
      
      <Modal
        title={formType === 'add' ? 'Add OEM Contract' : 'Edit OEM Contract'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={800}
        confirmLoading={localLoading}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSave} loading={localLoading}>
            Save
          </Button>,
        ]}
      >
        <ContractForm
          form={form}
          oemScopes={mappedScopes}
        />
      </Modal>
    </div>
  );
};

export default ContractsModule;