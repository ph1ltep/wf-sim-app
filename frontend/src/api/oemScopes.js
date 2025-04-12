// src/api/oemScopes.js - With schema information
import api from './index';

/**
 * Fetch all OEM scopes
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing array of OEMScopeSchema
 */
export const getAllOEMScopes = async () => {
  return await api.get('/oemscopes');
};

/**
 * Fetch a single OEM scope by ID
 * @param {string} id - OEM scope ID
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing OEMScopeSchema
 */
export const getOEMScopeById = async (id) => {
  return await api.get(`/oemscopes/${id}`);
};

/**
 * Create a new OEM scope
 * @param {Object} data - OEM scope data matching OEMScopeSchema
 * @returns {Promise<Object>} Response with CrudResponseSchema containing created OEM scope metadata
 */
export const createOEMScope = async (data) => {
  return await api.post('/oemscopes', data);
};

/**
 * Generate name for OEM scope based on selected options
 * @param {Object} data - OEM scope data matching OEMScopeSchema
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing generated name
 */
export const generateOEMScopeName = async (data) => {
  return await api.post('/oemscopes/generate-name', data);
};

/**
 * Update an existing OEM scope
 * @param {string} id - OEM scope ID
 * @param {Object} data - Updated OEM scope data matching OEMScopeSchema
 * @returns {Promise<Object>} Response with CrudResponseSchema containing updated OEM scope metadata
 */
export const updateOEMScope = async (id, data) => {
  return await api.put(`/oemscopes/${id}`, data);
};

/**
 * Delete an OEM scope
 * @param {string} id - OEM scope ID
 * @returns {Promise<Object>} Response with CrudResponseSchema containing deleted OEM scope metadata
 */
export const deleteOEMScope = async (id) => {
  return await api.delete(`/oemscopes/${id}`);
};