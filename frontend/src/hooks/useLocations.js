// src/hooks/useLocations.js
import { useState, useEffect } from 'react';
import { message } from 'antd';
import { 
  getAllLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation 
} from '../api/locations';

/**
 * Custom hook for managing location data and operations
 */
const useLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch all locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getAllLocations();
      
      if (response.success && response.data) {
        // Transform data format - add key property for Table
        const transformedData = response.data.map(location => ({
          key: location._id,
          ...location
        }));
        
        setLocations(transformedData);
        return transformedData;
      } else {
        throw new Error('Failed to fetch locations');
      }
    } catch (error) {
      message.error('Failed to fetch locations');
      console.error('Error fetching locations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new location
  const createNewLocation = async (data) => {
    try {
      setLoading(true);
      const response = await createLocation(data);
      
      const newLocation = {
        key: response.data._id,
        ...response.data
      };
      
      setLocations(prev => [...prev, newLocation]);
      message.success('Location added successfully');
      return { success: true, data: newLocation };
    } catch (error) {
      handleError(error, 'Failed to add location');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing location
  const updateExistingLocation = async (id, data) => {
    try {
      setLoading(true);
      const response = await updateLocation(id, data);
      
      const updatedLocation = {
        key: id,
        ...response.data
      };
      
      setLocations(prev => {
        const index = prev.findIndex(item => item.key === id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = updatedLocation;
          return updated;
        }
        return prev;
      });
      
      message.success('Location updated successfully');
      return { success: true, data: updatedLocation };
    } catch (error) {
      handleError(error, 'Failed to update location');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a location
  const deleteExistingLocation = async (id) => {
    try {
      setLoading(true);
      await deleteLocation(id);
      
      setLocations(prev => prev.filter(item => item.key !== id));
      message.success('Location deleted successfully');
      return { success: true };
    } catch (error) {
      message.error('Failed to delete location');
      console.error('Error deleting location:', error);
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
    fetchLocations();
  }, []);
  
  return {
    locations,
    loading,
    fetchLocations,
    createLocation: createNewLocation,
    updateLocation: updateExistingLocation,
    deleteLocation: deleteExistingLocation
  };
};

export default useLocations;