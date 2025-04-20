// src/api/simulation.js - Updated with current API routes from API guide
import api from './index';

/**
 * Run a simulation of distributions using the Monte Carlo engine
 * @param {Object} parameters - Simulation parameters matching SimRequestSchema
 * @returns {Promise<Object>} Response with SimulationResponseSchema containing simulation results
 */
export const simulateDistributions = (parameters) => {
  return api.post('/simulation/simulate', parameters);
};

/**
 * Get metadata for all registered distributions
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing array of distribution metadata
 */
export const getDistributionsInfo = () => {
  return api.get('/simulation/distributions');
};

/**
 * Validate distribution parameters against their schema
 * @param {Object} distribution - Distribution to validate matching DistributionTypeSchema
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing ValidationResponseSchema
 */
export const validateDistribution = (distribution) => {
  return api.post('/simulation/validate', distribution);
};

/**
 * Fit a distribution to provided data points
 * @param {Object} data - Object containing distribution and dataPoints matching FitDistributionSchema
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing DistributionParametersSchema
 */
export const fitDistribution = (data) => {
  return api.post('/simulation/fit', data);
};