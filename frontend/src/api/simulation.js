// src/api/simulation.js
import api from './index';

export const runSimulation = (parameters) => {
  return api.post('/simulate', parameters);
};

export const runCostModule = (parameters) => {
  return api.post('/cost', parameters);
};

export const runRevenueModule = (parameters) => {
  return api.post('/revenue', parameters);
};

export const runFinancingModule = (parameters) => {
  return api.post('/financing', parameters);
};

export const runRiskModule = (parameters) => {
  return api.post('/risk', parameters);
};

export const getDefaultParameters = () => {
  return api.get('/simulate/defaults');
};