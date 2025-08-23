// src/api/repairPackages.js - Repair packages API client
import api from './index';

/**
 * Fetch all repair packages with optional filters
 * @param {Object} filters - Optional filters (category, isDefault, isActive)
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing array of RepairPackageSchema
 */
export const getAllRepairPackages = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.category) params.append('category', filters.category);
  if (filters.isDefault !== undefined) params.append('isDefault', filters.isDefault);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
  
  const queryString = params.toString();
  const url = queryString ? `/repair-packages?${queryString}` : '/repair-packages';
  
  return await api.get(url);
};

/**
 * Fetch repair packages by category
 * @param {string} category - Repair package category
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing array of RepairPackageSchema
 */
export const getRepairPackagesByCategory = async (category) => {
  return await api.get(`/repair-packages/category/${category}`);
};

/**
 * Fetch a single repair package by ID
 * @param {string} id - Repair package ID
 * @returns {Promise<Object>} Response with SuccessResponseSchema containing RepairPackageSchema
 */
export const getRepairPackageById = async (id) => {
  return await api.get(`/repair-packages/${id}`);
};

/**
 * Create a new repair package
 * @param {Object} data - Repair package data matching RepairPackageSchema
 * @returns {Promise<Object>} Response with CrudResponseSchema containing created repair package metadata
 */
export const createRepairPackage = async (data) => {
  return await api.post('/repair-packages', data);
};

/**
 * Update an existing repair package
 * @param {string} id - Repair package ID
 * @param {Object} data - Updated repair package data matching RepairPackageSchema
 * @returns {Promise<Object>} Response with CrudResponseSchema containing updated repair package metadata
 */
export const updateRepairPackage = async (id, data) => {
  return await api.put(`/repair-packages/${id}`, data);
};

/**
 * Delete a repair package
 * @param {string} id - Repair package ID
 * @returns {Promise<Object>} Response with CrudResponseSchema containing deleted repair package metadata
 */
export const deleteRepairPackage = async (id) => {
  return await api.delete(`/repair-packages/${id}`);
};

/**
 * Clone an existing repair package
 * @param {string} id - Repair package ID to clone
 * @returns {Promise<Object>} Response with CrudResponseSchema containing cloned repair package metadata
 */
export const cloneRepairPackage = async (id) => {
  return await api.post(`/repair-packages/${id}/clone`);
};