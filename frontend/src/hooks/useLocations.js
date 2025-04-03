// src/hooks/useLocations.js
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
  getAllLocations, 
  getLocationById,
  createLocation as apiCreateLocation, 
  updateLocation as apiUpdateLocation, 
  deleteLocation as apiDeleteLocation 
} from '../api/locations';

/**
 * Custom hook for managing location data and operations
 * @returns {Object} Location data and operations
 */
const useLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Fetch all locations
   * @returns {Array} The fetched locations
   */
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllLocations();
      console.log('Locations API response:', response);
      
      if (response.success && response.data) {
        // Make sure response.data is an array before mapping
        if (Array.isArray(response.data)) {
          // Transform data format - add key property for Table
          const transformedData = response.data.map(location => ({
            key: location._id,
            ...location
          }));
          
          setLocations(transformedData);
          return transformedData;
        } else {
          console.error('API returned non-array data:', response.data);
          throw new Error('Invalid data format received from API');
        }
      } else {
        throw new Error(response.error || 'Failed to fetch locations');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch locations';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error fetching locations:', error);
      // Return empty array on error
      setLocations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Create a new location
   * @param {Object} data - Location data
   * @returns {Object} Result with success flag and data
   */
  const createLocation = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCreateLocation(data);
      
      if (response.success && response.data) {
        const newLocation = {
          key: response.data._id,
          ...response.data
        };
        
        setLocations(prev => [...prev, newLocation]);
        message.success('Location added successfully');
        return { success: true, data: newLocation };
      } else {
        throw new Error(response.error || 'Failed to add location');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add location';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error creating location:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update an existing location
   * @param {string} id - Location ID
   * @param {Object} data - Updated location data
   * @returns {Object} Result with success flag and data
   */
  const updateLocation = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiUpdateLocation(id, data);
      
      if (response.success && response.data) {
        const updatedLocation = {
          key: id,
          ...response.data
        };
        
        setLocations(prev => prev.map(item => 
          item.key === id ? updatedLocation : item
        ));
        
        message.success('Location updated successfully');
        return { success: true, data: updatedLocation };
      } else {
        throw new Error(response.error || 'Failed to update location');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update location';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error updating location:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Delete a location
   * @param {string} id - Location ID
   * @returns {Object} Result with success flag
   */
  const deleteLocation = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiDeleteLocation(id);
      
      if (response.success) {
        setLocations(prev => prev.filter(item => item.key !== id));
        message.success('Location deleted successfully');
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to delete location');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete location';
      setError(errorMessage);
      message.error(errorMessage);
      console.error('Error deleting location:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initialize data on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  
  return {
    locations,
    loading,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation
  };
};

export default useLocations;