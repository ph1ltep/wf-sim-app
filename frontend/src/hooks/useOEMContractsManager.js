// src/hooks/useOEMContractsManager.js
import { useCallback } from 'react';
import { message } from 'antd';
import { useScenario } from '../contexts/ScenarioContext';

export const useOEMContractsManager = () => {
  const { 
    hasValidScenario, 
    getValueByPath,
    arrayOperations 
  } = useScenario();

  // Path to OEM contracts array
  const CONTRACTS_PATH = 'settings.modules.contracts.oemContracts';

  // Get the current contracts
  const contracts = getValueByPath(CONTRACTS_PATH, []);

  // Add a new contract
  const addContract = useCallback((contract) => {
    if (!hasValidScenario()) return false;
    
    // Generate a unique ID if not provided
    const newContract = {
      id: contract.id || `contract_${Date.now()}`,
      ...contract
    };
    
    // Use arrayOperations to add to the contracts array
    const success = arrayOperations(CONTRACTS_PATH, 'add', newContract);
    
    if (success) {
      message.success('Contract added - Remember to save the scenario');
    }
    
    return success;
  }, [hasValidScenario, arrayOperations]);

  // Update an existing contract
  const updateContract = useCallback((id, updates) => {
    if (!hasValidScenario()) return false;
    
    const success = arrayOperations(CONTRACTS_PATH, 'update', updates, id);
    
    if (success) {
      message.success('Contract updated - Remember to save the scenario');
    }
    
    return success;
  }, [hasValidScenario, arrayOperations]);

  // Delete a contract
  const deleteContract = useCallback((id) => {
    if (!hasValidScenario()) return false;
    
    const success = arrayOperations(CONTRACTS_PATH, 'remove', null, id);
    
    if (success) {
      message.success('Contract removed - Remember to save the scenario');
    }
    
    return success;
  }, [hasValidScenario, arrayOperations]);

  // Implement batch operations
  const batchUpdate = useCallback((operations) => {
    if (!hasValidScenario()) return false;
    
    // Get the current contracts
    const currentContracts = [...contracts];
    let updatedContracts = [...currentContracts];
    
    // Apply all operations
    operations.forEach(op => {
      switch(op.type) {
        case 'add':
          updatedContracts.push({
            id: op.contract.id || `contract_${Date.now()}`,
            ...op.contract
          });
          break;
        case 'update':
          updatedContracts = updatedContracts.map(contract => 
            contract.id === op.id ? { ...contract, ...op.updates } : contract
          );
          break;
        case 'remove':
          updatedContracts = updatedContracts.filter(contract => 
            contract.id !== op.id
          );
          break;
        default:
          console.warn(`Unknown operation type: ${op.type}`);
      }
    });
    
    // Replace the entire array
    const success = arrayOperations(CONTRACTS_PATH, 'replace', updatedContracts);
    
    if (success) {
      message.success('Contracts updated - Remember to save the scenario');
    }
    
    return success;
  }, [hasValidScenario, contracts, arrayOperations]);

  return {
    contracts,
    addContract,
    updateContract,
    deleteContract,
    batchUpdate
  };
};