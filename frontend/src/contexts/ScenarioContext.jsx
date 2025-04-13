// src/contexts/ScenarioContext.jsx - With Immer optimization and proper API module usage
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { message, Alert } from 'antd';
import { produce } from 'immer'; // Import Immer's produce function
import { get, set } from 'lodash';

// Import API modules with 'api' prefix
import { getDefaults as apiGetDefaults } from '../api/defaults';
import {
  listScenarios as apiListScenarios,
  getScenarioById as apiGetScenarioById,
  createScenario as apiCreateScenario,
  updateScenario as apiUpdateScenario,
  deleteScenario as apiDeleteScenario
} from '../api/scenarios';

import { ScenarioSchema } from 'schemas/yup/scenario';
import { validatePath } from '../utils/validate';

const ScenarioContext = createContext();

export const useScenario = () => useContext(ScenarioContext);

// Centralized error handling function that works with API response format
const handleApiError = (response, fallbackMessage, showMessage = true) => {
  // API modules already return errors in a consistent format
  const errorMessage = response?.error || fallbackMessage;

  if (showMessage) {
    message.error(errorMessage);
  }

  console.error(fallbackMessage, response.errors || response.error);
  return { success: false, error: errorMessage };
};

export const ScenarioProvider = ({ children }) => {
  const [scenarioData, setScenarioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModified, setIsModified] = useState(false);

  // Wrapper for API calls with standard error handling
  const apiRequest = async (apiCall, successMessage = null) => {
    try {
      setLoading(true);
      const response = await apiCall();

      if (response.success) {
        if (successMessage) message.success(successMessage);
        return response;
      } else {
        return handleApiError(response, 'API operation failed', true);
      }
    } catch (error) {
      return handleApiError(error, 'API operation failed', true);
    } finally {
      setLoading(false);
    }
  };

  // Initialize a new scenario in memory
  const initializeScenario = useCallback(async () => {
    if (loading || isInitializing) return null;

    setIsInitializing(true);

    const response = await apiRequest(
      () => apiGetDefaults()
    );

    if (response.success && response.data) {
      // Use the complete scenario object directly
      const newScenario = ScenarioSchema.cast(response.data);
      setScenarioData(newScenario);
      setIsModified(false);
      message.success('New scenario initialized');
      setIsInitializing(false);
      return newScenario;
    } else {
      console.error('Failed to initialize scenario:', response.error);
    }

    setIsInitializing(false);
    return null;
  }, [loading, isInitializing]);

  // Initialize by creating a new scenario on mount
  useEffect(() => {
    if (!scenarioData && !isInitializing) {
      initializeScenario();
    }
  }, [scenarioData, initializeScenario, isInitializing]); // Include proper dependencies

  // Get a single scenario
  const getScenario = useCallback(async (id) => {
    if (loading) return null;

    const response = await apiRequest(
      () => apiGetScenarioById(id),
      'Scenario loaded successfully'
    );

    if (response.success && response.data) {
      setScenarioData(response.data);
      setIsModified(false);
      return response.data;
    }

    return null;
  }, [loading]);

  // Get all scenarios (lightweight listing)
  const getAllScenarios = useCallback(async (page = 1, limit = 100, search = '') => {
    if (loading) return [];

    try {
      setLoading(true);

      const response = await apiListScenarios(page, limit, search);

      if (response.success) {
        // Extract the items from the response based on the API structure
        return response || [];
      }

      return [];
    } catch (error) {
      handleApiError(error, 'Failed to fetch scenario list', false);
      return [];
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Prepare scenario payload for API requests
  const prepareScenarioPayload = useCallback((metadata = null) => {
    if (!scenarioData) {
      return null;
    }

    // Create a clean scenario object with only what the API needs
    return {
      ...(scenarioData._id && { _id: scenarioData._id }), // Include ID if it exists
      name: metadata?.name || scenarioData.name || 'New Scenario',
      description: metadata?.description || scenarioData.description || '',
      settings: scenarioData.settings,
      simulation: scenarioData.simulation || {}
    };
  }, [scenarioData]);

  // Save scenario to database
  const saveScenario = useCallback(async (metadata = null) => {
    if (loading) return null;

    const payload = prepareScenarioPayload(metadata);
    if (!payload) {
      message.error('No scenario to save');
      return null;
    }

    const response = await apiRequest(
      () => apiCreateScenario(payload),
      'Scenario saved successfully'
    );

    if (response.success && response.data) {
      // Use Immer to update the scenarioData with the server response
      setScenarioData(produce(scenarioData, draft => {
        draft.name = payload.name;
        draft.description = payload.description;
        draft._id = response.data._id;
        draft.createdAt = response.data.createdAt;
        draft.updatedAt = response.data.updatedAt;
      }));

      setIsModified(false);
      return {
        ...scenarioData,
        name: payload.name,
        description: payload.description,
        _id: response.data._id,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    }

    return null;
  }, [loading, prepareScenarioPayload, scenarioData]);

  // Update an existing scenario
  const updateScenario = useCallback(async (metadata = null) => {
    if (loading) return null;

    if (!scenarioData?._id) {
      message.error('No saved scenario to update');
      return null;
    }

    const payload = prepareScenarioPayload(metadata);
    if (!payload) return null;

    const response = await apiRequest(
      () => apiUpdateScenario(scenarioData._id, payload),
      'Scenario updated successfully'
    );

    if (response.success && response.data) {
      // Use Immer to update only the necessary fields
      setScenarioData(produce(scenarioData, draft => {
        draft.name = payload.name;
        draft.description = payload.description;
        draft.updatedAt = response.data.updatedAt;
      }));

      setIsModified(false);
      return {
        ...scenarioData,
        name: payload.name,
        description: payload.description,
        updatedAt: response.data.updatedAt
      };
    }

    return null;
  }, [loading, prepareScenarioPayload, scenarioData]);

  // Delete a scenario
  const deleteScenario = useCallback(async (id) => {
    if (loading) return false;

    const response = await apiRequest(
      () => apiDeleteScenario(id),
      'Scenario deleted successfully'
    );

    if (response.success) {
      // If we deleted the current scenario, create a new one
      if (scenarioData && scenarioData._id === id) {
        setScenarioData(null);
        initializeScenario();
      }
      return true;
    }

    return false;
  }, [loading, scenarioData, initializeScenario]);

  // Utility functions
  const hasValidScenario = useCallback((autoInitialize = true) => {
    if (!scenarioData) {
      if (autoInitialize && !isInitializing) {
        // Return promise for async API compatibility
        return Promise.resolve(false).then(() => {
          initializeScenario();
          return !!scenarioData;
        });
      }
      return false;
    }
    return true;
  }, [scenarioData, initializeScenario, isInitializing]);

  const isNewScenario = useCallback(() => {
    return scenarioData && !scenarioData._id;
  }, [scenarioData]);

  // Data operations - get value from path
  const getValueByPath = useCallback((path, defaultValue = null) => {
    if (!scenarioData) return defaultValue;
    return get(scenarioData, path, defaultValue);
  }, [scenarioData]);

  // Data operations - update by path (legacy method)
  // Now using Immer for more efficient updates
  const updateByPathV1 = useCallback((path, value) => {
    if (!scenarioData) return false;

    // Use Immer to create an immutable update
    setScenarioData(produce(scenarioData, draft => {
      set(draft, path, value);
    }));

    setIsModified(true);
    return true;
  }, [scenarioData]);

  // Data operations - update by path with validation (v2 method)
  // Now using Immer for more efficient updates
  const updateByPath = useCallback(async (path, value) => {
    // Handle case when no scenario exists
    if (!scenarioData) {
      // Optionally auto-initialize a scenario here if needed
      try {
        await initializeScenario();
        // If still no scenario, return error
        if (!scenarioData) {
          return {
            isValid: false,
            error: 'No active scenario',
            path,
            applied: false
          };
        }
      } catch (error) {
        return {
          isValid: false,
          error: 'Failed to initialize scenario',
          path,
          applied: false
        };
      }
    }

    // Validate the path and get result
    const validationResult = await validatePath(ScenarioSchema, path, value, scenarioData);

    // Include path in the result for clarity
    validationResult.path = path;

    if (validationResult.isValid) {
      // Use Immer to efficiently update only the changed path
      setScenarioData(produce(scenarioData, draft => {
        set(draft, path, validationResult.value);
      }));

      setIsModified(true);

      // Add a success flag to indicate the update was applied
      validationResult.applied = true;
    } else {
      validationResult.applied = false;
    }

    if (process.env.REACT_APP_LOG_SCENARIO_UDPATES === 'true') {
      console.log('updateByPath: ', validationResult);
    }
    return validationResult;
  }, [scenarioData, initializeScenario]);

  // Error component for reuse
  const ScenarioErrorComponent = useCallback(() => {
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

  // Context value
  const value = {
    scenarioData,
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
    updateByPath     // Legacy method - now using Immer for efficiency
    //1updateByPathV2,   // New method with validation, also using Immer
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};

export default ScenarioProvider;