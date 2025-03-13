// src/contexts/SimulationContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDefaultParameters, runSimulation } from '../api/simulation';
import { createScenario, updateScenario, getScenarioById } from '../api/scenarios';

// Import mock API instead
//import { getDefaultParameters, runSimulation } from '../api/mockApi';

import { message } from 'antd';

const SimulationContext = createContext();

export const useSimulation = () => useContext(SimulationContext);

export const SimulationProvider = ({ children }) => {
  const [parameters, setParameters] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);

  // Load default parameters on mount
  useEffect(() => {
    loadDefaultParameters();
  }, []);

  const loadDefaultParameters = async () => {
    try {
      setLoading(true);
      const response = await getDefaultParameters();
      setParameters(response.defaults);
    } catch (err) {
      message.error('Failed to load default parameters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateModuleParameters = (moduleName, newParams) => {
    setParameters(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        ...newParams,
      },
    }));
  };

  const runFullSimulation = async () => {
    if (!parameters) {
      message.warning('Parameters not yet loaded.');
      return;
    }

    try {
      setLoading(true);
      const response = await runSimulation(parameters);
      setResults(response.results);
      message.success('Simulation completed successfully');
      return response.results;
    } catch (err) {
      message.error('Simulation failed');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentScenario = async (name, description = '') => {
    try {
      setLoading(true);
      const scenarioData = {
        name,
        description,
        parameters
      };

      let response;
      if (currentScenario) {
        response = await updateScenario(currentScenario._id, scenarioData);
      } else {
        response = await createScenario(scenarioData);
      }

      setCurrentScenario(response.scenario);
      message.success('Scenario saved successfully');
      return response.scenario;
    } catch (err) {
      message.error('Failed to save scenario');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = async (id) => {
    try {
      setLoading(true);
      const response = await getScenarioById(id);
      setParameters(response.scenario.parameters);
      setCurrentScenario(response.scenario);
      setResults(response.scenario.results);
      message.success('Scenario loaded successfully');
      return response.scenario;
    } catch (err) {
      message.error('Failed to load scenario');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    parameters,
    results,
    loading,
    currentScenario,
    setParameters,
    updateModuleParameters,
    loadDefaultParameters,
    runFullSimulation,
    saveCurrentScenario,
    loadScenario,
    setCurrentScenario,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};