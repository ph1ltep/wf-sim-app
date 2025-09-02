// src/hooks/useRepairPackages.js
import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import {
  getAllRepairPackages,
  createRepairPackage as apiCreateRepairPackage,
  updateRepairPackage as apiUpdateRepairPackage,
  deleteRepairPackage as apiDeleteRepairPackage,
  cloneRepairPackage as apiCloneRepairPackage
} from '../api/repairPackages';

/**
 * Custom hook for managing repair packages data and operations
 * @returns {Object} Hook state and functions
 */
const useRepairPackages = () => {
  const [repairPackages, setRepairPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Fetch all repair packages
   * @param {Object} filters - Optional filters for the request
   * @returns {Array} The fetched repair packages
   */
  const fetchRepairPackages = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllRepairPackages(filters);
      console.log('Repair packages API response:', response);
      
      if (response.success && response.data) {
        // Make sure response.data is an array before mapping
        if (Array.isArray(response.data)) {
          // Transform data format - add key property for Table
          const transformedData = response.data.map(repairPackage => ({
            key: repairPackage._id,
            ...repairPackage
          }));
          
          setRepairPackages(transformedData);
          return transformedData;
        } else {
          console.error('API returned non-array data:', response.data);
          throw new Error('Invalid data format received from API');
        }
      } else {
        throw new Error(response.error || 'Failed to fetch repair packages');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch repair packages';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error fetching repair packages:', error);
      // Return empty array on error
      setRepairPackages([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Create a new repair package
   * @param {Object} data - Repair package data
   * @returns {Object} Result with success flag and data
   */
  const createRepairPackage = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCreateRepairPackage(data);
      
      if (response.success && response.data) {
        // Backend only returns metadata, so we combine it with the original data
        const newRepairPackage = {
          key: response.data._id,
          _id: response.data._id,
          ...data,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt
        };
        
        setRepairPackages(prev => [...prev, newRepairPackage]);
        message.success('Repair package added successfully');
        return { success: true, data: newRepairPackage };
      } else {
        throw new Error(response.error || 'Failed to add repair package');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add repair package';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error creating repair package:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update an existing repair package
   * @param {string} id - Repair package ID
   * @param {Object} data - Updated repair package data
   * @returns {Object} Result with success flag and data
   */
  const updateRepairPackage = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiUpdateRepairPackage(id, data);
      
      if (response.success && response.data) {
        // Backend only returns metadata, so we combine it with the original data
        const updatedRepairPackage = {
          key: id,
          _id: id,
          ...data,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt
        };
        
        setRepairPackages(prev => prev.map(item => 
          item.key === id ? updatedRepairPackage : item
        ));
        
        message.success('Repair package updated successfully');
        return { success: true, data: updatedRepairPackage };
      } else {
        throw new Error(response.error || 'Failed to update repair package');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update repair package';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error updating repair package:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Delete a repair package
   * @param {string} id - Repair package ID
   * @returns {Object} Result with success flag
   */
  const deleteRepairPackage = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiDeleteRepairPackage(id);
      
      if (response.success) {
        setRepairPackages(prev => prev.filter(item => item.key !== id));
        message.success('Repair package deleted successfully');
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to delete repair package');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete repair package';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error deleting repair package:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Clone an existing repair package
   * @param {string} id - Repair package ID to clone
   * @returns {Object} Result with success flag and data
   */
  const cloneRepairPackage = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCloneRepairPackage(id);
      
      if (response.success && response.data) {
        const clonedRepairPackage = {
          key: response.data._id,
          ...response.data
        };
        
        setRepairPackages(prev => [...prev, clonedRepairPackage]);
        message.success('Repair package cloned successfully');
        return { success: true, data: clonedRepairPackage };
      } else {
        throw new Error(response.error || 'Failed to clone repair package');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to clone repair package';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error cloning repair package:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initialize data on mount
  useEffect(() => {
    fetchRepairPackages();
  }, [fetchRepairPackages]);
  
  return {
    repairPackages,
    loading,
    error,
    fetchRepairPackages,
    createRepairPackage,
    updateRepairPackage,
    deleteRepairPackage,
    cloneRepairPackage
  };
};

export default useRepairPackages;