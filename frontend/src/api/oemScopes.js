// src/api/oemScopes.js - Improved error handling
import api from './index';

/**
 * Fetch all OEM scopes
 * @returns {Promise<Object>} Response with data or error
 */
export const getAllOEMScopes = async () => {
  try {
    return await api.get('/oemscopes');
  } catch (error) {
    console.error('getAllOEMScopes error:', error);
    return {
      success: false,
      error: error.error || 'Failed to fetch OEM scopes',
      data: null
    };
  }
};

/**
 * Fetch a single OEM scope by ID
 * @param {string} id - OEM scope ID
 * @returns {Promise<Object>} Response with data or error
 */
export const getOEMScopeById = async (id) => {
  try {
    return await api.get(`/oemscopes/${id}`);
  } catch (error) {
    console.error(`getOEMScopeById(${id}) error:`, error);
    return {
      success: false,
      error: error.error || 'Failed to fetch OEM scope',
      data: null
    };
  }
};

/**
 * Create a new OEM scope
 * @param {Object} data - OEM scope data
 * @returns {Promise<Object>} Response with data or error
 */
export const createOEMScope = async (data) => {
  try {
    return await api.post('/oemscopes', data);
  } catch (error) {
    console.error('createOEMScope error:', error);
    return {
      success: false,
      error: error.error || 'Failed to create OEM scope',
      data: null
    };
  }
};

/**
 * Generate name for OEM scope
 * @param {Object} data - OEM scope data
 * @returns {Promise<Object>} Response with generated name or error
 */
export const generateOEMScopeName = async (data) => {
  try {
    return await api.post('/oemscopes/generate-name', data);
  } catch (error) {
    console.error('generateOEMScopeName error:', error);
    return {
      success: false,
      error: error.error || 'Failed to generate OEM scope name',
      name: null
    };
  }
};

/**
 * Update an existing OEM scope
 * @param {string} id - OEM scope ID
 * @param {Object} data - Updated OEM scope data
 * @returns {Promise<Object>} Response with data or error
 */
export const updateOEMScope = async (id, data) => {
  try {
    return await api.put(`/oemscopes/${id}`, data);
  } catch (error) {
    console.error(`updateOEMScope(${id}) error:`, error);
    return {
      success: false,
      error: error.error || 'Failed to update OEM scope',
      data: null
    };
  }
};

/**
 * Delete an OEM scope
 * @param {string} id - OEM scope ID
 * @returns {Promise<Object>} Response with success or error
 */
export const deleteOEMScope = async (id) => {
  try {
    return await api.delete(`/oemscopes/${id}`);
  } catch (error) {
    console.error(`deleteOEMScope(${id}) error:`, error);
    return {
      success: false,
      error: error.error || 'Failed to delete OEM scope'
    };
  }
};