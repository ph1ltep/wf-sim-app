// frontend/src/hooks/useOEMContracts.js - Updated version
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
  getAllOEMContracts, 
  getOEMContractById, 
  createOEMContract, 
  updateOEMContract, 
  deleteOEMContract 
} from '../api/oemContracts';
import { getAllOEMScopes } from '../api/oemScopes';

/**
 * Custom hook for managing OEM contracts data and operations
 */
const useOEMContracts = () => {
  const [oemContracts, setOEMContracts] = useState([]);
  const [oemScopes, setOEMScopes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch OEM contracts data
  const fetchOEMContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllOEMContracts();
      
      // Transform data format - add key property for Table
      const transformedData = response.data.map(contract => ({
        key: contract._id,
        ...contract
      }));
      
      setOEMContracts(transformedData);
      return transformedData;
    } catch (error) {
      message.error('Failed to fetch OEM contracts');
      console.error('Error fetching OEM contracts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch OEM scopes for dropdowns
  const fetchOEMScopes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllOEMScopes();
      
      // Transform data format for Select dropdown
      const transformedData = response.data.map(scope => ({
        value: scope._id,
        label: scope.name,
        scope // Include the full scope object for reference
      }));
      
      setOEMScopes(transformedData);
      return transformedData;
    } catch (error) {
      message.error('Failed to fetch OEM scopes');
      console.error('Error fetching OEM scopes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Create a new OEM contract
  const createContract = async (formData) => {
    try {
      setLoading(true);
      console.log('Form data for creating contract:', formData);
      
      const response = await createOEMContract(formData);
      const newContract = {
        key: response.data._id,
        ...response.data
      };
      
      // Update the contracts list
      setOEMContracts(prevContracts => [...prevContracts, newContract]);
      message.success('OEM contract added successfully');
      
      // Return the result for further processing if needed
      return { success: true, data: newContract };
    } catch (error) {
      handleError(error, 'Failed to add OEM contract');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing OEM contract
  const updateContract = async (id, formData) => {
    try {
      setLoading(true);
      console.log('Form data for updating contract:', formData);
      
      const response = await updateOEMContract(id, formData);
      
      // Update the contracts list
      setOEMContracts(prevContracts => {
        const index = prevContracts.findIndex(contract => contract.key === id);
        if (index > -1) {
          const updatedContracts = [...prevContracts];
          updatedContracts[index] = {
            key: id,
            ...response.data
          };
          return updatedContracts;
        }
        return prevContracts;
      });
      
      message.success('OEM contract updated successfully');
      return { success: true, data: response.data };
    } catch (error) {
      handleError(error, 'Failed to update OEM contract');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Delete an OEM contract
  const deleteContract = async (id) => {
    try {
      setLoading(true);
      await deleteOEMContract(id);
      
      // Update the contracts list
      setOEMContracts(prevContracts => prevContracts.filter(contract => contract.key !== id));
      message.success('OEM contract deleted successfully');
      return { success: true };
    } catch (error) {
      message.error('Failed to delete OEM contract');
      console.error('Error deleting OEM contract:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to handle API errors
  const handleError = (error, defaultMessage) => {
    if (error.response?.status === 400) {
      message.error(error.response?.data?.error || 'Validation failed. Please check your inputs.');
    } else {
      message.error(defaultMessage);
      console.error(defaultMessage, error);
    }
  };
  
  // Initialize data on mount
  useEffect(() => {
    fetchOEMContracts();
    fetchOEMScopes();
  }, [fetchOEMContracts, fetchOEMScopes]);
  
  return {
    oemContracts,
    oemScopes,
    loading,
    fetchOEMContracts,
    fetchOEMScopes,
    createContract,
    updateContract,
    deleteContract
  };
};

export default useOEMContracts;