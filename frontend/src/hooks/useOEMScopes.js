// src/hooks/useOEMScopes.js
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
  getAllOEMScopes, 
  getOEMScopeById,
  createOEMScope as apiCreateScope, 
  updateOEMScope as apiUpdateScope, 
  deleteOEMScope as apiDeleteScope,
  generateOEMScopeName as apiGenerateName
} from '../api/oemScopes';

/**
 * Custom hook for managing OEM scope data and operations
 * @returns {Object} OEM scope data and operations
 */
const useOEMScopes = () => {
  const [oemScopes, setOEMScopes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateNameLoading, setGenerateNameLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Fetch all OEM scopes
   * @returns {Array} The fetched OEM scopes
   */
  const fetchScopes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllOEMScopes();
      
      if (response.success && response.data) {
        // Transform data format - add key property for Table
        const transformedData = response.data.map(scope => ({
          key: scope._id,
          ...scope
        }));
        
        setOEMScopes(transformedData);
        return transformedData;
      } else {
        throw new Error(response.error || 'Failed to fetch OEM scopes');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch OEM scopes';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error fetching OEM scopes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Create a new OEM scope
   * @param {Object} data - OEM scope data
   * @returns {Object} Result with success flag and data
   */
  const createScope = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data - handle nested objects
      const preparedData = {
        ...data,
        correctiveMajorDetails: {
          tooling: data['correctiveMajorDetails.tooling'] || false,
          manpower: data['correctiveMajorDetails.manpower'] || false,
          parts: data['correctiveMajorDetails.parts'] || false
        }
      };
      
      // Remove flattened fields
      delete preparedData['correctiveMajorDetails.tooling'];
      delete preparedData['correctiveMajorDetails.manpower'];
      delete preparedData['correctiveMajorDetails.parts'];
      
      const response = await apiCreateScope(preparedData);
      
      if (response.success && response.data) {
        const newScope = {
          key: response.data._id,
          ...response.data
        };
        
        setOEMScopes(prev => [...prev, newScope]);
        message.success('OEM scope added successfully');
        return { success: true, data: newScope };
      } else {
        throw new Error(response.error || 'Failed to add OEM scope');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add OEM scope';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error creating OEM scope:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update an existing OEM scope
   * @param {string} id - OEM scope ID
   * @param {Object} data - Updated OEM scope data
   * @returns {Object} Result with success flag and data
   */
  const updateScope = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data - handle nested objects
      const preparedData = {
        ...data,
        correctiveMajorDetails: {
          tooling: data['correctiveMajorDetails.tooling'] || false,
          manpower: data['correctiveMajorDetails.manpower'] || false,
          parts: data['correctiveMajorDetails.parts'] || false
        }
      };
      
      // Remove flattened fields
      delete preparedData['correctiveMajorDetails.tooling'];
      delete preparedData['correctiveMajorDetails.manpower'];
      delete preparedData['correctiveMajorDetails.parts'];
      
      const response = await apiUpdateScope(id, preparedData);
      
      if (response.success && response.data) {
        const updatedScope = {
          key: id,
          ...response.data
        };
        
        setOEMScopes(prev => prev.map(item => 
          item.key === id ? updatedScope : item
        ));
        
        message.success('OEM scope updated successfully');
        return { success: true, data: updatedScope };
      } else {
        throw new Error(response.error || 'Failed to update OEM scope');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update OEM scope';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error updating OEM scope:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Delete an OEM scope
   * @param {string} id - OEM scope ID
   * @returns {Object} Result with success flag
   */
  const deleteScope = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiDeleteScope(id);
      
      if (response.success) {
        setOEMScopes(prev => prev.filter(item => item.key !== id));
        message.success('OEM scope deleted successfully');
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to delete OEM scope');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete OEM scope';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error deleting OEM scope:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Generate a name for an OEM scope based on selected options
   * @param {Object} data - OEM scope data
   * @returns {Object} Result with success flag and generated name
   */
  const generateName = useCallback(async (data) => {
    try {
      setGenerateNameLoading(true);
      setError(null);
      
      // Prepare data - handle nested objects
      const preparedData = {
        ...data,
        correctiveMajorDetails: {
          tooling: data['correctiveMajorDetails.tooling'] || false,
          manpower: data['correctiveMajorDetails.manpower'] || false,
          parts: data['correctiveMajorDetails.parts'] || false
        }
      };
      
      // Remove flattened fields
      delete preparedData['correctiveMajorDetails.tooling'];
      delete preparedData['correctiveMajorDetails.manpower'];
      delete preparedData['correctiveMajorDetails.parts'];
      
      const response = await apiGenerateName(preparedData);
      
      if (response.success && response.name) {
        return { success: true, name: response.name };
      } else {
        throw new Error(response.error || 'Failed to generate name');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to generate name';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error generating name:', error);
      return { success: false, error: errorMessage };
    } finally {
      setGenerateNameLoading(false);
    }
  }, []);
  
  // Initialize data on mount
  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);
  
  return {
    oemScopes,
    loading,
    generateNameLoading,
    error,
    fetchScopes,
    createScope,
    updateScope,
    deleteScope,
    generateName
  };
};

export default useOEMScopes;