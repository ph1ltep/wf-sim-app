// src/api/defaults.js
import api from './index';

export const getDefaults = async (platformType = 'geared') => {
  try {
    const response = await api.get(`/defaults?platform=${platformType}`);
    return response;
  } catch (error) {
    console.error('Error fetching default settings:', error);
    throw error;
  }
};