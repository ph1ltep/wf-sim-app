// src/api/defaults.js - With schema information
import api from './index';

/**
 * Get default parameter values for a new scenario
 * @param {string} platformType - Wind turbine platform type ('geared' or 'direct-drive')
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing ScenarioSchema defaults
 */
export const getDefaults = async (platformType = 'geared') => {
  return await api.get(`/defaults?platform=${platformType}`);
};