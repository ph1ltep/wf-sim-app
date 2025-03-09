import axios from 'axios';

const API_BASE_URL = `https://code-server.fthome.org/proxy/5000/api`;

export const runSimulation = async (simulationParams) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/simulate`, simulationParams);
    return response.data;
  } catch (error) {
    console.error('Error running simulation:', error);
    throw error;
  }
};
