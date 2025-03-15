// src/api/oemScopes.js
import api from './index';

export const getAllOEMScopes = () => {
  return api.get('/oemscopes');
};

export const getOEMScopeById = (id) => {
  return api.get(`/oemscopes/${id}`);
};

export const createOEMScope = (data) => {
  return api.post('/oemscopes', data);
};

export const generateOEMScopeName = (data) => {
  return api.post('/oemscopes/generate-name', data);
};

export const updateOEMScope = (id, data) => {
  return api.put(`/oemscopes/${id}`, data);
};

export const deleteOEMScope = (id) => {
  return api.delete(`/oemscopes/${id}`);
};