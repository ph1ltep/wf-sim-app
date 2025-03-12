// src/api/scenarios.js
import api from './index';

export const getAllScenarios = (page = 1, limit = 10) => {
  return api.get(`/scenarios?page=${page}&limit=${limit}`);
};

export const getScenarioById = (id) => {
  return api.get(`/scenarios/${id}`);
};

export const createScenario = (data) => {
  return api.post('/scenarios', data);
};

export const updateScenario = (id, data) => {
  return api.put(`/scenarios/${id}`, data);
};

export const deleteScenario = (id) => {
  return api.delete(`/scenarios/${id}`);
};

export const compareScenarios = (ids) => {
  return api.post('/scenarios/compare', { ids });
};