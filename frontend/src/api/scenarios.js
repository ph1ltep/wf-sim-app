// src/api/scenarios.js - Updated with current API routes
import api from './index';

/**
 * Fetch a paginated list of all scenarios with optional filtering
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @param {string} search - Optional search term for filtering by name/description
 * @returns {Promise<Object>} Response with ListResponseSchema containing array of ScenarioListingSchema
 */
export const listScenarios = async (page = 1, limit = 10, search = '') => {
  let url = `/scenarios?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return await api.get(url);
};

/**
 * Fetch a scenario by its ID
 * @param {string} id - Scenario ID
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing ScenarioSchema
 */
export const getScenarioById = async (id) => {
  return await api.get(`/scenarios/${id}`);
};

/**
 * Create a new scenario
 * @param {Object} data - Scenario data (partial or complete ScenarioSchema)
 * @returns {Promise<Object>} Response with CrudResponseSchema containing created scenario metadata
 */
export const createScenario = async (data) => {
  return await api.post('/scenarios', data);
};

/**
 * Update an existing scenario
 * @param {string} id - Scenario ID
 * @param {Object} data - Updated scenario data (partial or complete ScenarioSchema)
 * @returns {Promise<Object>} Response with CrudResponseSchema containing updated scenario metadata
 */
export const updateScenario = async (id, data) => {
  return await api.put(`/scenarios/${id}`, data);
};

/**
 * Delete a scenario
 * @param {string} id - Scenario ID
 * @returns {Promise<Object>} Response with CrudResponseSchema containing deleted scenario metadata
 */
export const deleteScenario = async (id) => {
  return await api.delete(`/scenarios/${id}`);
};