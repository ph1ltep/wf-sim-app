// frontend/src/api/oemContracts.js
import api from './index';

export const getAllOEMContracts = () => {
  return api.get('/oemcontracts');
};

export const getOEMContractById = (id) => {
  return api.get(`/oemcontracts/${id}`);
};

export const createOEMContract = (data) => {
  return api.post('/oemcontracts', data);
};

export const updateOEMContract = (id, data) => {
  return api.put(`/oemcontracts/${id}`, data);
};

export const deleteOEMContract = (id) => {
  return api.delete(`/oemcontracts/${id}`);
};