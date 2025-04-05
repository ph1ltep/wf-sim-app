// src/api/index.js - Improved error handling and debug logging
import axios from 'axios';

// Get the correct API URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/proxy/5000/api';
console.log('API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add this to ensure cookies are sent with the request
  withCredentials: true,
  // Add timeout to prevent infinite waiting
  timeout: 30000
});

// Debugging: Log configuration
console.log('API Configuration:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  withCredentials: api.defaults.withCredentials
});

// Add a request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response (${response.config.url}):`, response.status, response.data);

    // Check if the response data is already in our expected format
    if (response.data &&
      (response.data.success !== undefined ||
        response.data.data !== undefined ||
        response.data.error !== undefined)) {
      // Response is already in our expected format
      return {
        ...response.data,
        status: response.status,
        statusText: response.statusText
      };
    }

    // Otherwise transform response data to our standard format
    return {
      success: true,
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  },
  (error) => {
    // Extract the error details and create a standardized error response
    let errorMessage = 'An unexpected error occurred';
    let errorDetails = null;

    if (error.response) {
      // The request was made and the server responded with an error status
      errorMessage = error.response.data?.error ||
        error.response.data?.message ||
        `Server error: ${error.response.status} ${error.response.statusText}`;
      errorDetails = error.response.data;

      console.error('API Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config.url
      });
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from server. Please check your connection.';
      console.error('API No Response Error:', {
        request: error.request,
        url: error.config?.url
      });
    } else {
      // Something happened in setting up the request
      errorMessage = error.message || 'Error setting up the request';
      console.error('API Setup Error:', error.message);
    }


    // Add network details for debugging
    if (error.config) {
      console.error('Failed request details:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL
      });
    }

    // Create a standardized error response
    const standardError = {
      success: false,
      error: errorMessage,
      details: errorDetails,
      status: error.response?.status || 0,
      statusText: error.response?.statusText || 'Unknown Error'
    };

    console.error('Standardized error:', standardError);

    // Return the error in our standard format
    return Promise.resolve(standardError);
  }
);

export default api;