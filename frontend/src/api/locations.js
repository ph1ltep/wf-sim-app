// src/api/locations.js - With debug logging
import api from './index';

/**
 * Fetch all locations
 * @returns {Promise<Object>} Response with data or error
 */
export const getAllLocations = async () => {
  try {
    console.log('Fetching all locations...');
    const response = await api.get('/locations');
    console.log('Raw API response:', response);
    
    // Ensure data is in the correct format
    if (response.success && response.data) {
      // The response should have data as an array
      // If it's not, adjust the structure
      if (!Array.isArray(response.data)) {
        console.warn('API did not return an array, adjusting structure...');
        
        // Check if the data might be nested
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Found nested data array, extracting...');
          response.data = response.data.data;
        } else {
          console.error('Cannot parse location data, returning empty array');
          response.data = [];
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('getAllLocations error:', error);
    return {
      success: false,
      error: error.error || 'Failed to fetch locations',
      data: []  // Return empty array instead of null
    };
  }
};

/**
 * Fetch a single location by ID
 * @param {string} id - Location ID
 * @returns {Promise<Object>} Response with data or error
 */
export const getLocationById = async (id) => {
  try {
    return await api.get(`/locations/${id}`);
  } catch (error) {
    console.error(`getLocationById(${id}) error:`, error);
    return {
      success: false,
      error: error.error || 'Failed to fetch location',
      data: null
    };
  }
};

/**
 * Create a new location
 * @param {Object} data - Location data
 * @returns {Promise<Object>} Response with data or error
 */
export const createLocation = async (data) => {
  try {
    return await api.post('/locations', data);
  } catch (error) {
    console.error('createLocation error:', error);
    return {
      success: false,
      error: error.error || 'Failed to create location',
      data: null
    };
  }
};

/**
 * Update an existing location
 * @param {string} id - Location ID
 * @param {Object} data - Updated location data
 * @returns {Promise<Object>} Response with data or error
 */
export const updateLocation = async (id, data) => {
  try {
    return await api.put(`/locations/${id}`, data);
  } catch (error) {
    console.error(`updateLocation(${id}) error:`, error);
    return {
      success: false,
      error: error.error || 'Failed to update location',
      data: null
    };
  }
};

/**
 * Delete a location
 * @param {string} id - Location ID
 * @returns {Promise<Object>} Response with success or error
 */
export const deleteLocation = async (id) => {
  try {
    return await api.delete(`/locations/${id}`);
  } catch (error) {
    console.error(`deleteLocation(${id}) error:`, error);
    return {
      success: false,
      error: error.error || 'Failed to delete location'
    };
  }
};