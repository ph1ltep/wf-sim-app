// src/api/index.js - Update with better error handling
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/proxy/5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add this to ensure cookies are sent with the request
  withCredentials: true,
});

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Extract the error message from the response
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'An unexpected error occurred';
                        
    console.error('API Error:', errorMessage);
    console.error('Full error:', error);
    
    // You could handle specific error cases here if needed
    
    return Promise.reject(error);
  }
);

export default api;