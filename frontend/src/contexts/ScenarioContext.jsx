// src/contexts/ScenarioContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { message } from 'antd';
import { produce } from 'immer';
import { get, set, update, cloneDeep } from 'lodash';
import api from '../api/index';

const ScenarioContext = createContext();

export const useScenario = () => useContext(ScenarioContext);

export const ScenarioProvider = ({ children }) => {
  const [scenarioData, setScenarioData] = useState(null);
  const [scenarioList, setScenarioList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dirtyForms, setDirtyForms] = useState({});

  // Use a ref for form handlers instead of state
  const formSubmitHandlersRef = useRef({});

  // Initialize by creating a new scenario on mount
  useEffect(() => {
    initializeScenario();
  }, []);

  // Register a form's submit handler - using ref approach
  const registerFormSubmitHandler = useCallback((formId, submitHandler) => {
    // Only log when the handler actually changes
    if (formSubmitHandlersRef.current[formId] !== submitHandler) {
      console.log(`Registering submit handler for form: ${formId}`);
      formSubmitHandlersRef.current[formId] = submitHandler;
    }

    // Return unregister function
    return () => {
      console.log(`Unregistering submit handler for form: ${formId}`);
      delete formSubmitHandlersRef.current[formId];
    };
  }, []);

  // Submit all dirty forms - use the ref instead of state
  const submitAllForms = useCallback(async () => {
    console.log("Submitting all dirty forms");
    console.log("Dirty forms:", dirtyForms);
    console.log("Available handlers:", Object.keys(formSubmitHandlersRef.current));

    const promises = [];

    // Call submit handlers for all dirty forms
    Object.entries(dirtyForms).forEach(([formId, isDirty]) => {
      if (isDirty && formSubmitHandlersRef.current[formId]) {
        console.log(`Submitting form: ${formId}`);
        promises.push(formSubmitHandlersRef.current[formId]());
      }
    });

    // Wait for all submissions to complete
    try {
      await Promise.all(promises);

      // Clear all dirty flags
      setDirtyForms({});

      return true;
    } catch (error) {
      console.error("Error submitting forms:", error);
      return false;
    }
  }, [dirtyForms]);

  // Function to update dirty state
  const updateFormDirtyState = useCallback((isDirty, formId) => {
    if (!formId) return;

    // Handle the special 'all' case to clear all dirty states
    if (formId === 'all') {
      console.log("Clearing all form dirty states");
      setDirtyForms({});
      return;
    }

    // For debugging
    // console.log(`Updating form dirty state: ${formId} => ${isDirty}`);

    setDirtyForms(prev => {
      const newState = {
        ...prev,
        [formId]: isDirty
      };
      return newState;
    });
  }, []);

  // Check if any form is dirty
  const hasUnsavedChanges = useMemo(() => {
    const anyDirty = Object.values(dirtyForms).some(Boolean);
    return anyDirty;
  }, [dirtyForms]);

  // =========== API Operations ===========

  const initializeScenario = async () => {
    try {
      setLoading(true);
      const response = await api.post('/scenarios', {
        name: 'New Scenario',
        description: 'Default configuration scenario'
      });

      if (response.success && response.data) {
        setScenarioData(response.data);
        message.success('Scenario initialized successfully');
      } else {
        message.error('Failed to initialize scenario: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      message.error('Failed to initialize scenario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScenario = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/scenarios/${id}`);

      if (response.success && response.data) {
        setScenarioData(response.data);
        message.success('Scenario loaded successfully');
        return response.data;
      } else {
        message.error('Failed to load scenario: ' + (response.error || 'Unknown error'));
        return null;
      }
    } catch (err) {
      message.error('Failed to load scenario');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllScenarios = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/scenarios?page=${page}&limit=${limit}`);

      if (response.success && response.data && response.data.scenarios) {
        setScenarioList(response.data.scenarios);
        return {
          scenarios: response.data.scenarios,
          pagination: response.data.pagination
        };
      } else {
        message.error('Failed to fetch scenarios: ' + (response.error || 'Unknown error'));
        return null;
      }
    } catch (err) {
      message.error('Failed to fetch scenarios');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update the saveScenario function in ScenarioContext.jsx
  const saveScenario = useCallback(async () => {
    if (!scenarioData) {
      message.error('No scenario to save');
      return null;
    }

    try {
      setLoading(true);

      const payload = {
        name: scenarioData.name,
        description: scenarioData.description,
        settings: scenarioData.settings
      };

      let response;

      // Check if this scenario is already saved in the database (has an _id and exists in scenarioList)
      const scenarioExists = scenarioData._id &&
        scenarioList.some(scenario => scenario._id === scenarioData._id);

      if (scenarioExists) {
        // Update existing scenario
        console.log('Updating existing scenario:', scenarioData._id);
        response = await api.put(`/scenarios/${scenarioData._id}`, payload);
      } else {
        // Create new scenario
        console.log('Creating new scenario');
        response = await api.post('/scenarios', payload);
      }

      if (response.success && response.data) {
        // Update the local state with the saved/updated scenario
        setScenarioData(prevData => ({
          ...prevData,
          _id: response.data._id, // Update the ID in case this was a new scenario
          updatedAt: response.data.updatedAt
        }));

        // If this was a new scenario, add it to the scenarioList
        if (!scenarioExists) {
          setScenarioList(prevList => [
            {
              _id: response.data._id,
              name: scenarioData.name,
              description: scenarioData.description,
              updatedAt: response.data.updatedAt
            },
            ...prevList
          ]);
        }

        message.success('Scenario saved successfully');

        // Clear dirty state for all forms after successful save
        setDirtyForms({});

        return response.data;
      } else {
        message.error('Failed to save scenario: ' + (response.error || 'Unknown error'));
        return null;
      }
    } catch (err) {
      message.error('Failed to save scenario: ' + (err.response?.data?.error || err.message));
      console.error('Save scenario error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [scenarioData, scenarioList]);

  const deleteScenario = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await api.delete(`/scenarios/${id}`);

      if (response.success) {
        if (scenarioData && scenarioData._id === id) {
          setScenarioData(null);
          initializeScenario();
        }

        setScenarioList(prev => prev.filter(scenario => scenario._id !== id));
        message.success('Scenario deleted successfully');
        return true;
      } else {
        message.error('Failed to delete scenario: ' + (response.error || 'Unknown error'));
        return false;
      }
    } catch (err) {
      message.error('Failed to delete scenario');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [scenarioData]);

  // =========== Data Operations Using Lodash & Immer ===========

  // Utility to check if we have a valid scenario
  const hasValidScenario = useCallback(() => {
    if (!scenarioData) {
      message.error('No active scenario');
      return false;
    }
    return true;
  }, [scenarioData]);

  // Get a value by path
  const getValueByPath = useCallback((path, defaultValue = null) => {
    if (!hasValidScenario()) return defaultValue;
    return get(scenarioData, path, defaultValue);
  }, [scenarioData, hasValidScenario]);

  // Update a value by path
  const updateByPath = useCallback((path, value) => {
    if (!hasValidScenario()) return false;

    setScenarioData(produce(draft => {
      set(draft, path, value);
    }));

    return true;
  }, [hasValidScenario]);

  // Update a value by applying a function to it
  const updateByFunction = useCallback((path, updateFn) => {
    if (!hasValidScenario()) return false;

    setScenarioData(produce(draft => {
      const currentValue = get(draft, path);
      const newValue = updateFn(currentValue);
      set(draft, path, newValue);
    }));

    return true;
  }, [hasValidScenario]);

  // Array operations with paths
  // Inside ScenarioContext.jsx, update the arrayOperations function

  const arrayOperations = useCallback((path, operation, item, itemId = null) => {
    if (!hasValidScenario()) return false;

    try {
      setScenarioData(produce(draft => {
        const array = get(draft, path);

        if (!Array.isArray(array)) {
          console.warn('Path does not point to an array:', path);
          return false;
        }

        switch (operation) {
          case 'update':
            if (itemId === null) return false;

            const index = array.findIndex(i => {
              const itemValue = String(i.value || i.id || i._id);
              const searchValue = String(itemId);
              return itemValue === searchValue;
            });

            if (index >= 0) {
              const oldValue = { ...array[index] };
              array[index] = { ...array[index], ...item };
              console.log('ScenarioContext: Update details', {
                index,
                oldValue,
                newValue: array[index]
              });
            } else {
              console.warn('ScenarioContext: Item not found for update:', itemId);
              return false;
            }
            break;

          case 'add':
            array.push(item);
            break;

          case 'remove':
            if (itemId === null) return false;

            const removeIndex = array.findIndex(i => {
              const itemValue = String(i.value || i.id || i._id);
              const searchValue = String(itemId);
              return itemValue === searchValue;
            });

            if (removeIndex >= 0) {
              array.splice(removeIndex, 1);
            }
            break;

          case 'replace':
            set(draft, path, item);
            break;

          default:
            console.warn(`Unknown array operation: ${operation}`);
            return false;
        }
      }));

      return true;
    } catch (error) {
      console.error('Array operation error:', error);
      return false;
    }
  }, [hasValidScenario]);

  // =========== Shorthand Functions for Common Operations ===========

  // Update basic scenario properties
  const updateScenarioMeta = useCallback((updates) => {
    if (!hasValidScenario()) return false;

    setScenarioData(produce(draft => {
      if (updates.name !== undefined) draft.name = updates.name;
      if (updates.description !== undefined) draft.description = updates.description;
    }));

    return true;
  }, [hasValidScenario]);

  // Update any section of settings
  const updateSettings = useCallback((section, updates) => {
    if (!hasValidScenario()) return false;

    return updateByPath(['settings', section], {
      ...getValueByPath(['settings', section], {}),
      ...updates
    });
  }, [hasValidScenario, updateByPath, getValueByPath]);

  // Update module settings
  const updateModuleSettings = useCallback((moduleName, updates) => {
    if (!hasValidScenario()) return false;

    return updateByPath(['settings', 'modules', moduleName], {
      ...getValueByPath(['settings', 'modules', moduleName], {}),
      ...updates
    });
  }, [hasValidScenario, updateByPath, getValueByPath]);

  // Provide context values
  const value = {
    // State
    scenarioData,
    scenarioList,
    loading,
    selectedLocation,
    dirtyForms,
    hasUnsavedChanges,

    // Location selection
    setSelectedLocation,
    updateSelectedLocation: setSelectedLocation,
    updateFormDirtyState,

    // API operations
    initializeScenario,
    getScenario,
    getAllScenarios,
    saveScenario,
    deleteScenario,

    // Form submission management
    registerFormSubmitHandler,
    submitAllForms,

    // Utility checks
    hasValidScenario,

    // Core data operations
    getValueByPath,
    updateByPath,
    updateByFunction,
    arrayOperations,

    // Shorthand operations
    updateScenarioMeta,
    updateSettings,
    updateModuleSettings
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};

export default ScenarioProvider;
