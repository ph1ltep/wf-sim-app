// src/contexts/ScenarioContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { message } from 'antd';
import { produce } from 'immer';
import { get, set, update, cloneDeep } from 'lodash';
import api from '../api/index';
import { getDefaults } from '../api/defaults';

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

  // Initialize a new scenario in memory
  const initializeScenario = async () => {
    try {
      setLoading(true);

      // Get default settings from the API
      const response = await getDefaults();

      if (response.success && response.data) {
        // Create a scenario object without saving to DB
        const newScenario = {
          name: 'New Scenario',
          description: 'Default configuration scenario',
          settings: response.data.defaults,
          simulation: {
            inputSim: null,
            outputSim: null
          }
        };

        setScenarioData(newScenario);
        message.success('New scenario initialized');
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

  // Get all scenarios
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

  // Get a single scenario
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

  // Save scenario to database
  const saveScenario = useCallback(async () => {
    if (!scenarioData) {
      message.error('No scenario to save');
      return null;
    }

    try {
      setLoading(true);

      const payload = {
        name: scenarioData.name || 'New Scenario',
        description: scenarioData.description || '',
        settings: scenarioData.settings
      };

      // Create a new scenario in the database
      const response = await api.post('/scenarios', payload);

      if (response.success && response.data) {
        // Update the local state with the saved scenario (now including _id)
        const savedScenario = {
          ...scenarioData,
          _id: response.data._id,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt
        };

        setScenarioData(savedScenario);

        // Add to scenario list
        setScenarioList(prevList => [
          {
            _id: response.data._id,
            name: savedScenario.name,
            description: savedScenario.description,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt
          },
          ...prevList
        ]);

        message.success('Scenario saved successfully');

        // Clear dirty state for all forms after successful save
        setDirtyForms({});

        return savedScenario;
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
  }, [scenarioData]);

  // Update an existing scenario in the database
  const updateScenario = useCallback(async () => {
    if (!scenarioData || !scenarioData._id) {
      message.error('No saved scenario to update');
      return null;
    }

    try {
      setLoading(true);

      const payload = {
        name: scenarioData.name,
        description: scenarioData.description,
        settings: scenarioData.settings
      };

      // Update the existing scenario in the database
      const response = await api.put(`/scenarios/${scenarioData._id}`, payload);

      if (response.success && response.data) {
        // Update the local state with the updated scenario
        const updatedScenario = {
          ...scenarioData,
          updatedAt: response.data.updatedAt
        };

        setScenarioData(updatedScenario);

        // Update the scenario in the list
        setScenarioList(prevList =>
          prevList.map(scenario =>
            scenario._id === scenarioData._id
              ? { ...scenario, ...response.data }
              : scenario
          )
        );

        message.success('Scenario updated successfully');


        // Clear dirty state for all forms after successful update
        setDirtyForms({});

        return updatedScenario;
      } else {
        message.error('Failed to update scenario: ' + (response.error || 'Unknown error'));
        return null;
      }
    } catch (err) {
      message.error('Failed to update scenario: ' + (err.response?.data?.error || err.message));
      console.error('Update scenario error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [scenarioData]);

  // Delete a scenario
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

  // Function to update scenario metadata
  const updateScenarioMeta = useCallback((updates) => {
    if (!scenarioData) return false;

    setScenarioData(produce(draft => {
      if (updates.name !== undefined) draft.name = updates.name;
      if (updates.description !== undefined) draft.description = updates.description;
    }));

    return true;
  }, [scenarioData]);

  // Utility to check if we have a valid scenario
  const hasValidScenario = useCallback(() => {
    if (!scenarioData) {
      message.error('No active scenario');
      return false;
    }
    return true;
  }, [scenarioData]);

  const isNewScenario = useCallback(() => {
    // A scenario is new if:
    // 1. We have scenarioData (valid scenario)
    // 2. But it doesn't have an _id (never saved to db)
    return scenarioData && !scenarioData._id;
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

  // Array operations with paths
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
            } else {
              console.warn('Item not found for update:', itemId);
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
    updateScenario,
    deleteScenario,

    // Form submission management
    registerFormSubmitHandler,
    submitAllForms,

    // Utility checks
    hasValidScenario,
    isNewScenario,

    // Core data operations
    getValueByPath,
    updateByPath,
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