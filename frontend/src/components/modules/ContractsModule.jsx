// src/components/modules/ContractsModule.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Modal, Table, message, Alert, Space } from 'antd';
import { PlusOutlined, ToolOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOEMContractsManager } from '../../hooks/useOEMContractsManager';
import useOEMScopes from '../../hooks/useOEMScopes';
import { getOEMContractColumns } from './Contracts/contractColumns';

// Import the new ContractForm that uses React Hook Form
import ContractForm from './Contracts/ContractForm';

const { Title } = Typography;

const ContractsModule = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add');
  const [currentContract, setCurrentContract] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scopesFetched, setScopesFetched] = useState(false);
  
  // Use our custom hooks
  const { 
    contracts, 
    addContract, 
    updateContract, 
    deleteContract 
  } = useOEMContractsManager();
  
  // Use custom hook to fetch OEM scopes
  const { 
    oemScopes, 
    loading: loadingScopes, 
    fetchOEMScopes 
  } = useOEMScopes();
  
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

  // Handle opening the form modal for adding a new contract
  const handleAdd = () => {
    setCurrentContract(null);
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
  const handleDelete = (id) => {
    try {
      setLocalLoading(true);
      
      const success = deleteContract(id);
      
      if (!success) {
        message.error('Failed to remove contract');
      }
    } catch (error) {
      console.error('Error removing contract:', error);
      setError('Failed to remove contract: ' + (error.message || 'Unknown error'));
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Handle form submission
  const handleFormSubmit = (data) => {
    try {
      setLocalLoading(true);
      
      // Prepare the contract data
      const contractData = {
        ...(currentContract?.id ? { id: currentContract.id } : {}),
        ...data,
        fixedFee: Number(data.fixedFee) || 0
      };
      
      // If we have oemScopeId, get the name from the scopes list
      if (contractData.oemScopeId) {
        const selectedScope = mappedScopes.find(scope => scope.id === contractData.oemScopeId);
        if (selectedScope) {
          contractData.oemScopeName = selectedScope.name;
        }
      }
      
      console.log("Contract data to save:", contractData);
      
      let success;
      
      if (formType === 'add') {
        // Add the new contract
        success = addContract(contractData);
      } else {
        // Update the existing contract
        success = updateContract(currentContract.id, contractData);
      }
      
      if (success) {
        setModalVisible(false);
      } else {
        message.error('Failed to save contract');
      }
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
  const noScenario = !contracts || contracts.length === undefined;
  
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
          dataSource={contracts} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={localLoading || loadingScopes}
          locale={{ emptyText: 'No OEM contracts defined for this scenario' }}
        />
      </Card>
      
      <Modal
        title={formType === 'add' ? 'Add OEM Contract' : 'Edit OEM Contract'}
        open={modalVisible}
        onCancel={handleCancel}
        width={800}
        // Remove footer as React Hook Form will handle the submit button
        footer={null}
      >
        <ContractForm
          defaultValues={currentContract}
          oemScopes={mappedScopes}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={localLoading}
          formType={formType}
        />
      </Modal>
    </div>
  );
};

export default ContractsModule;