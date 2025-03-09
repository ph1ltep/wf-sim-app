// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://code-server.fthome.org/proxy/5000/api';

export const runSimulation = async (simulationParams) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/simulate`, simulationParams);
    return response.data;
  } catch (error) {
    console.error('Error in runSimulation:', error);
    throw error;
  }
};

export const getScenarios = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scenarios`);
    return response.data;
  } catch (error) {
    console.error('Error in getScenarios:', error);
    throw error;
  }
};

export const getScenario = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scenarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error in getScenario:', error);
    throw error;
  }
};

export const saveScenario = async (scenarioData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scenarios`, scenarioData);
    return response.data;
  } catch (error) {
    console.error('Error in saveScenario:', error);
    throw error;
  }
};

export const updateScenario = async (id, scenarioData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/scenarios/${id}`, scenarioData);
    return response.data;
  } catch (error) {
    console.error('Error in updateScenario:', error);
    throw error;
  }
};

export const deleteScenario = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/scenarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteScenario:', error);
    throw error;
  }
};
