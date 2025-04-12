// src/api/index.js - With simple debug logging
import axios from 'axios';

// Get the correct API URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/proxy/5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000
});

/**
 * Creates an error object matching ErrorResponseSchema
 */
const createErrorResponse = (message, statusCode = 500, errors = []) => {
  const errorResponse = {
    success: false,
    error: message,
    statusCode,
    errors: Array.isArray(errors) ? errors : [],
    timestamp: new Date()
  };

  // Log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error Response:', errorResponse);
  }

  return errorResponse;
};

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request in development mode if LOG_API_REQ=true
    if (process.env.NODE_ENV === 'development' && process.env.LOG_API_REQ === 'true') {
      console.log('API Request:', JSON.stringify({
        url: config.url,
        method: config.method,
        data: config.data
      }, null, 2));
    }
    return config;
  },
  (error) => {
    return Promise.resolve(createErrorResponse('Request configuration error', 0));
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development mode if LOG_API_RES=true
    if (process.env.NODE_ENV === 'development' && process.env.LOG_API_RES === 'true') {
      console.log('API Success Response:', JSON.stringify(response.data, null, 2));
    }

    // Pass through the response data directly
    return response.data;
  },
  (error) => {
    let errorResponse;

    if (error.response) {
      // Server responded with an error status
      const data = error.response.data;

      // If the response is already in ErrorResponseSchema format, use it
      if (data && data.success === false && data.error !== undefined) {
        errorResponse = data;
      } else {
        // Create a standardized error response
        let errorMessage = 'Server error';
        if (data && data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          errorMessage = `Server error: ${error.response.status} ${error.response.statusText}`;
        }

        errorResponse = createErrorResponse(errorMessage, error.response.status);
      }
    }
    else if (error.request) {
      // No response received
      errorResponse = createErrorResponse('No response received from server', 0);
    }
    else {
      // Request setup error
      errorResponse = createErrorResponse(error.message || 'Error setting up the request', 500);
    }

    // Log error response in development mode if LOG_API_RES=true
    if (process.env.NODE_ENV === 'development' && process.env.LOG_API_RES === 'true') {
      console.error('API Error Response:', JSON.stringify(errorResponse, null, 2));
    }

    return Promise.resolve(errorResponse);
  }
);

export default api;