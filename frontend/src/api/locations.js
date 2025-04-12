// src/api/locations.js - With schema information
import api from './index';

/**
 * Fetch all locations
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing array of LocationDefaultsSchema
 */
export const getAllLocations = async () => {
  return await api.get('/locations');
};

/**
 * Fetch a single location by ID
 * @param {string} id - Location ID
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing LocationDefaultsSchema
 */
export const getLocationById = async (id) => {
  return await api.get(`/locations/${id}`);
};

/**
 * Create a new location
 * @param {Object} data - Location data matching LocationDefaultsSchema
 * @returns {Promise<Object>} Response with CrudResponseSchema containing created location metadata
 */
export const createLocation = async (data) => {
  return await api.post('/locations', data);
};

/**
 * Update an existing location
 * @param {string} id - Location ID
 * @param {Object} data - Updated location data matching LocationDefaultsSchema
 * @returns {Promise<Object>} Response with CrudResponseSchema containing updated location metadata
 */
export const updateLocation = async (id, data) => {
  return await api.put(`/locations/${id}`, data);
};

/**
 * Delete a location
 * @param {string} id - Location ID
 * @returns {Promise<Object>} Response with CrudResponseSchema containing deleted location metadata
 */
export const deleteLocation = async (id) => {
  return await api.delete(`/locations/${id}`);
};