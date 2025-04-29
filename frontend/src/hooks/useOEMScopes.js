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
import { applyFormValuesToSchema } from '../utils/formUtils';
import { OEMScopeSchema } from 'schemas/yup/oemScope';

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
        // Make sure response.data is an array before mapping
        if (Array.isArray(response.data)) {
          // Transform data format - add key property for Table
          const transformedData = response.data.map(scope => ({
            key: scope._id,
            ...scope
          }));

          setOEMScopes(transformedData);
          return transformedData;
        } else {
          console.error('API returned non-array data:', response.data);
          throw new Error('Invalid data format received from API');
        }
      } else {
        throw new Error(response.error || 'Failed to fetch OEM scopes');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch OEM scopes';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error fetching OEM scopes:', error);
      // Return empty array on error
      setOEMScopes([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get OEM scope by ID
   * @param {string} id - OEM scope ID
   * @returns {Object|null} The OEM scope or null if not found
   */
  const getScopeById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOEMScopeById(id);

      if (response.success && response.data) {
        const scope = {
          key: response.data._id,
          ...response.data
        };
        return scope;
      } else {
        throw new Error(response.error || 'Failed to fetch OEM scope');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch OEM scope';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error fetching OEM scope:', error);
      return null;
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

      // Apply form values to schema for proper formatting and validation
      const formattedData = applyFormValuesToSchema(data, OEMScopeSchema);

      const response = await apiCreateScope(formattedData);

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

      // Apply form values to schema for proper formatting and validation
      const formattedData = applyFormValuesToSchema(data, OEMScopeSchema);

      const response = await apiUpdateScope(id, formattedData);

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
 * Generate a name for an OEM scope based on its features
 * @param {Object} data - Scope feature data
 * @returns {Object} Result with generated name
 */
  const generateName = useCallback(async (data) => {
    try {
      setGenerateNameLoading(true);

      // Create a copy of the data and add a temporary name if it's missing
      const dataWithTempName = {
        ...data,
        // Use existing name or a placeholder that makes it clear it's temporary
        name: data.name || 'Temp_Name_For_Generation'
      };

      // Apply form values to schema for proper formatting and validation
      const formattedData = applyFormValuesToSchema(dataWithTempName, OEMScopeSchema);

      const response = await apiGenerateName(formattedData);
      const newName = response.data?.name;

      if (response.success && newName) {
        return { success: true, name: newName };
      } else {
        throw new Error(response.error || 'Failed to generate name');
      }
    } catch (error) {
      message.error('Failed to generate name');
      console.error('Error generating name:', error);
      return { success: false, name: null };
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