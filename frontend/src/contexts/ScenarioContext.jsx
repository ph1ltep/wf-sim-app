// src/contexts/ScenarioContext.jsx - With useReducer implementation

import React, { createContext, useContext, useEffect, useCallback, useMemo, useReducer } from 'react';
import { message, Alert } from 'antd';
import { produce } from 'immer';
import { get, set } from 'lodash';
import api from '../api/index';
import { getDefaults } from '../api/defaults';
import { ScenarioSchema } from 'schemas/yup/scenario';
import { validatePath } from '../utils/validate';

const ScenarioContext = createContext();

const { validate } = require('../utils/validate'); // Adjust path if needed

export const useScenario = () => useContext(ScenarioContext);

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_SCENARIO_DATA: 'SET_SCENARIO_DATA',
  SET_SCENARIO_LIST: 'SET_SCENARIO_LIST',
  SET_LOCATION: 'SET_LOCATION',
  SET_MODIFIED: 'SET_MODIFIED',
  UPDATE_PATH: 'UPDATE_PATH',
  UPDATE_ARRAY: 'UPDATE_ARRAY',
  RESET_STATE: 'RESET_STATE'
};

// Initial state
const initialState = {
  scenarioData: null,
  scenarioList: [],
  loading: false,
  selectedLocation: null,
  isModified: false
};

// Centralized error handling function
const handleApiError = (error, fallbackMessage, showMessage = true) => {
  const errorMessage = error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;

  if (showMessage) {
    message.error(errorMessage);
  }

  console.error(fallbackMessage, error);
  return { success: false, error: errorMessage };
};

// Reducer function
function scenarioReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTION_TYPES.SET_SCENARIO_DATA:
      return {
        ...state,
        scenarioData: action.payload,
        isModified: action.resetModified ? false : state.isModified
      };

    case ACTION_TYPES.SET_SCENARIO_LIST:
      return { ...state, scenarioList: action.payload };

    case ACTION_TYPES.SET_LOCATION:
      return { ...state, selectedLocation: action.payload };

    case ACTION_TYPES.SET_MODIFIED:
      return { ...state, isModified: action.payload };

    case ACTION_TYPES.UPDATE_PATH:
      return {
        ...state,
        scenarioData: produce(state.scenarioData, draft => {
          set(draft, action.payload.path, action.payload.value);
        }),
        isModified: true
      };

    case ACTION_TYPES.UPDATE_ARRAY:
      return {
        ...state,
        scenarioData: produce(state.scenarioData, draft => {
          const array = get(draft, action.payload.path);
          if (!Array.isArray(array)) return;

          const { operation, item, itemId } = action.payload;

          switch (operation) {
            case 'update':
              if (itemId === null) return;
              const index = array.findIndex(i =>
                String(i.value || i.id || i._id) === String(itemId)
              );
              if (index >= 0) {
                array[index] = { ...array[index], ...item };
              }
              break;

            case 'add':
              array.push(item);
              break;

            case 'remove':
              if (itemId === null) return;
              const removeIndex = array.findIndex(i =>
                String(i.value || i.id || i._id) === String(itemId)
              );
              if (removeIndex >= 0) {
                array.splice(removeIndex, 1);
              }
              break;

            case 'replace':
              set(draft, action.payload.path, item);
              break;

            default:
              return state;
          }
        }),
        isModified: true
      };

    case ACTION_TYPES.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

export const ScenarioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(scenarioReducer, initialState);
  const { scenarioData, scenarioList, loading, selectedLocation, isModified } = state;

  // Wrapper for API calls with standard error handling
  const apiRequest = async (apiCall, successMessage = null) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      const response = await apiCall();

      if (response.success) {
        if (successMessage) message.success(successMessage);
        return response;
      } else {
        return handleApiError({ message: response.error }, 'API operation failed', true);
      }
    } catch (error) {
      return handleApiError(error, 'API operation failed', true);
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Initialize a new scenario in memory
  const initializeScenario = useCallback(async () => {
    const response = await apiRequest(
      () => getDefaults()
    );

    if (response.success && response.data) {
      // Use the complete scenario object directly
      const newScenario = response.data.defaults;

      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_DATA,
        payload: newScenario,
        resetModified: true
      });

      message.success('New scenario initialized');
      return newScenario;
    } else {
      console.error('Failed to initialize scenario:', response.error);
    }

    return null;
  }, []);

  // Initialize by creating a new scenario on mount
  useEffect(() => {
    initializeScenario();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get all scenarios
  const getAllScenarios = useCallback(async (page = 1, limit = 10) => {
    const response = await apiRequest(
      () => api.get(`/scenarios?page=${page}&limit=${limit}`)
    );

    if (response.success && response.data?.scenarios) {
      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_LIST,
        payload: response.data.scenarios
      });

      return {
        scenarios: response.data.scenarios,
        pagination: response.data.pagination
      };
    }

    return null;
  }, []);

  // Get a single scenario
  const getScenario = useCallback(async (id) => {
    const response = await apiRequest(
      () => api.get(`/scenarios/${id}`),
      'Scenario loaded successfully'
    );

    if (response.success && response.data) {
      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_DATA,
        payload: response.data,
        resetModified: true
      });

      return response.data;
    }

    return null;
  }, []);

  // Save scenario to database
  const saveScenario = useCallback(async (metadata = null) => {
    if (!scenarioData) {
      message.error('No scenario to save');
      return null;
    }

    const payload = {
      name: metadata?.name || scenarioData.name || 'New Scenario',
      description: metadata?.description || scenarioData.description || '',
      settings: scenarioData.settings,
      simulation: scenarioData.simulation || {}
    };

    const response = await apiRequest(
      () => api.post('/scenarios', payload),
      'Scenario saved successfully'
    );

    if (response.success && response.data) {
      const savedScenario = {
        ...scenarioData,
        name: payload.name,
        description: payload.description,
        _id: response.data._id,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };

      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_DATA,
        payload: savedScenario,
        resetModified: true
      });

      // Update scenario list
      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_LIST,
        payload: [
          {
            _id: response.data._id,
            name: savedScenario.name,
            description: savedScenario.description,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt
          },
          ...scenarioList
        ]
      });

      return savedScenario;
    }

    return null;
  }, [scenarioData, scenarioList]);

  // Update an existing scenario
  const updateScenario = useCallback(async (metadata = null) => {
    if (!scenarioData?._id) {
      message.error('No saved scenario to update');
      return null;
    }

    // Create payload with full scenario data, applying metadata overrides if provided
    const payload = {
      ...scenarioData, // Include all fields from scenarioData
      ...(metadata && { // Override with metadata if provided
        name: metadata.name,
        description: metadata.description,
      }),
    };

    // Validate payload against ScenarioSchema
    const validationResult = await validate(ScenarioSchema, payload);

    if (!validationResult.isValid) {
      // Display validation errors to the user
      const errorMessage = validationResult.errors.join(', ');
      message.error(`Validation failed: ${errorMessage}`);
      return null;
    }

    const response = await apiRequest(
      () => api.put(`/scenarios/${scenarioData._id}`, payload),
      'Scenario updated successfully'
    );

    if (response.success && response.data) {
      const updatedScenario = {
        ...scenarioData,
        name: response.data.name, // Use server-returned values
        description: response.data.description,
        updatedAt: response.data.updatedAt
      };

      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_DATA,
        payload: updatedScenario,
        resetModified: true
      });

      // Update scenario in list
      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_LIST,
        payload: scenarioList.map(scenario =>
          scenario._id === scenarioData._id
            ? {
              ...scenario,
              name: response.data.name,
              description: response.data.description,
              updatedAt: response.data.updatedAt
            }
            : scenario
        )
      });

      return updatedScenario;
    }

    return null;
  }, [scenarioData, scenarioList]);

  // Delete a scenario
  const deleteScenario = useCallback(async (id) => {
    const response = await apiRequest(
      () => api.delete(`/scenarios/${id}`),
      'Scenario deleted successfully'
    );

    if (response.success) {
      if (scenarioData && scenarioData._id === id) {
        dispatch({ type: ACTION_TYPES.SET_SCENARIO_DATA, payload: null });
        initializeScenario();
      }

      dispatch({
        type: ACTION_TYPES.SET_SCENARIO_LIST,
        payload: scenarioList.filter(scenario => scenario._id !== id)
      });

      return true;
    }

    return false;
  }, [scenarioData, scenarioList, initializeScenario]);

  // Set location
  const setSelectedLocation = useCallback((location) => {
    dispatch({ type: ACTION_TYPES.SET_LOCATION, payload: location });
  }, []);

  // Utility functions
  const hasValidScenario = useCallback((autoInitialize = true) => {
    if (!scenarioData) {
      if (autoInitialize) {
        // Return promise for async API compatibility
        return Promise.resolve(false).then(() => {
          initializeScenario();
          return !!scenarioData;
        });
      }
      return false;
    }
    return true;
  }, [scenarioData, initializeScenario]);

  const isNewScenario = useCallback(() => {
    return scenarioData && !scenarioData._id;
  }, [scenarioData]);

  // Data operations
  const getValueByPath = useCallback((path, defaultValue = null) => {
    if (!scenarioData) return defaultValue;
    return get(scenarioData, path, defaultValue);
  }, [scenarioData]);

  const updateByPath = useCallback((path, value) => {
    if (!scenarioData) return false;

    dispatch({
      type: ACTION_TYPES.UPDATE_PATH,
      payload: { path, value }
    });

    return true;
  }, [scenarioData]);

  const updateByPathV2 = useCallback(async (path, value) => {
    if (!scenarioData) return { isValid: false, error: 'No active scenario', path };

    // Validate the path and get result
    const validationResult = await validatePath(ScenarioSchema, path, value, scenarioData);

    // Include path in the result for clarity
    validationResult.path = path;

    if (validationResult.isValid) {
      // Update the context only if validation succeeds
      dispatch({
        type: ACTION_TYPES.UPDATE_PATH,
        payload: { path, value: validationResult.value }
      });

      // Add a success flag to indicate the update was applied
      validationResult.applied = true;
    }

    return validationResult;
  }, [scenarioData]);


  // const arrayOperations = useCallback((path, operation, item, itemId = null) => {
  //   if (!scenarioData) return false;

  //   try {
  //     dispatch({
  //       type: ACTION_TYPES.UPDATE_ARRAY,
  //       payload: { path, operation, item, itemId }
  //     });

  //     return true;
  //   } catch (error) {
  //     handleApiError(error, 'Array operation failed', false);
  //     return false;
  //   }
  // }, [scenarioData]);

  // Helper functions for updating settings

  // const updateSettings = useCallback((section, updates) => {
  //   if (!scenarioData) return false;

  //   return updateByPath(['settings', section], {
  //     ...getValueByPath(['settings', section], {}),
  //     ...updates
  //   });
  // }, [scenarioData, updateByPath, getValueByPath]);

  // const updateModuleSettings = useCallback((moduleName, updates) => {
  //   if (!scenarioData) return false;

  //   return updateByPath(['settings', 'modules', moduleName], {
  //     ...getValueByPath(['settings', 'modules', moduleName], {}),
  //     ...updates
  //   });
  // }, [scenarioData, updateByPath, getValueByPath]);

  // Error component for reuse
  const ScenarioErrorComponent = useMemo(() => {
    if (!scenarioData) {
      return (
        <Alert
          message="No Active Scenario"
          description="Please create a new scenario or load an existing one."
          type="info"
        />
      );
    }
    return null;
  }, [scenarioData]);

  // Context value - keep the same public API
  const value = {
    scenarioData,
    scenarioList,
    loading,
    selectedLocation,
    hasUnsavedChanges: isModified,

    setSelectedLocation,
    updateSelectedLocation: setSelectedLocation,

    initializeScenario,
    getScenario,
    getAllScenarios,
    saveScenario,
    updateScenario,
    deleteScenario,

    hasValidScenario,
    ScenarioErrorComponent,
    isNewScenario,

    getValueByPath,
    updateByPath//,
    //arrayOperations,

    //updateSettings,
    //updateModuleSettings
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};

export default ScenarioProvider;