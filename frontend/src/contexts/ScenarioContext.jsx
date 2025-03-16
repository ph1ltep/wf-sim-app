// src/contexts/ScenarioContext.jsx (renamed from SimulationContext.jsx)
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDefaultParameters, runSimulation } from '../api/simulation';
import { createScenario, updateScenario, getScenarioById } from '../api/scenarios';
import { message } from 'antd';
import moment from 'moment';

const ScenarioContext = createContext();

export const useScenario = () => useContext(ScenarioContext);

export const ScenarioProvider = ({ children }) => {
  const [scenarioData, setScenarioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Load default parameters on mount
  useEffect(() => {
    loadDefaultParameters();
  }, []);

  const loadDefaultParameters = async () => {
    try {
      setLoading(true);
      const response = await getDefaultParameters();
      setScenarioData(response.defaults);
      setCurrentScenario(null);
      setSelectedLocation(null);
    } catch (err) {
      message.error('Failed to load default parameters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateModuleParameters = (path, newParams) => {
    setScenarioData(prev => {
      if (!prev) return prev;
      
      // Create a deep copy of the scenario data
      const updated = JSON.parse(JSON.stringify(prev));
      
      // Handle date fields specifically - convert moment objects to ISO strings
      const processedParams = { ...newParams };
      if (path === 'general' && processedParams.startDate && moment.isMoment(processedParams.startDate)) {
        processedParams.startDate = processedParams.startDate.toISOString();
      }
      
      // Update different parts of the scenario based on the path
      if (path === 'general') {
        updated.settings.general = {
          ...updated.settings.general,
          ...processedParams
        };
      } 
      else if (path === 'simulation') {
        updated.settings.simulation = {
          ...updated.settings.simulation,
          ...processedParams
        };
      }
      else if (path === 'probabilities') {
        if (!updated.settings.simulation) {
          updated.settings.simulation = {};
        }
        updated.settings.simulation.probabilities = {
          ...updated.settings.simulation.probabilities,
          ...processedParams
        };
      }
      else if (path === 'projectMetrics') {
        updated.settings.metrics = {
          ...updated.settings.metrics,
          ...processedParams
        };
      }
      else if (path === 'scenario') {
        // Update name and description at the top level
        if (processedParams.name) updated.name = processedParams.name;
        if (processedParams.description) updated.description = processedParams.description;
        
        // Update other scenario settings in the settings object
        const { name, description, ...otherParams } = processedParams;
        if (Object.keys(otherParams).length > 0) {
          // These go into project.location, project.currency, etc.
          if (otherParams.location) {
            if (!updated.settings.project) updated.settings.project = {};
            updated.settings.project.location = otherParams.location;
          }
          if (otherParams.currency || otherParams.foreignCurrency || otherParams.exchangeRate) {
            if (!updated.settings.project) updated.settings.project = {};
            if (!updated.settings.project.currency) updated.settings.project.currency = {};
            
            if (otherParams.currency) updated.settings.project.currency.local = otherParams.currency;
            if (otherParams.foreignCurrency) updated.settings.project.currency.foreign = otherParams.foreignCurrency;
            if (otherParams.exchangeRate) updated.settings.project.currency.exchangeRate = otherParams.exchangeRate;
          }
        }
      }
      // Module-specific parameters (financing, cost, revenue, risk)
      else if (['financing', 'cost', 'revenue', 'risk'].includes(path)) {
        if (!updated.settings.modules) updated.settings.modules = {};
        updated.settings.modules[path] = {
          ...updated.settings.modules[path],
          ...processedParams
        };
      }
      // Handle OEM contracts
      else if (path === 'oemContracts') {
        if (!updated.settings.modules) updated.settings.modules = {};
        if (!updated.settings.modules.contracts) updated.settings.modules.contracts = {};
        updated.settings.modules.contracts.oemContracts = processedParams;
      }
      // Wind farm settings
      else if (path === 'windFarm') {
        if (!updated.settings.project) updated.settings.project = {};
        updated.settings.project.windFarm = {
          ...updated.settings.project.windFarm,
          ...processedParams
        };
      }
      
      return updated;
    });
  };

  // Update the selected location
  const updateSelectedLocation = (locationData) => {
    setSelectedLocation(locationData);
    
    // Also update the scenario location information in parameters
    if (locationData) {
      updateModuleParameters('scenario', { 
        location: locationData.countryCode,
        currency: locationData.currency,
        foreignCurrency: locationData.foreignCurrency,
        exchangeRate: locationData.exchangeRate
      });
    }
  };

  const runFullSimulation = async () => {
    if (!scenarioData) {
      message.warning('Parameters not yet loaded.');
      return;
    }

    try {
      setLoading(true);
      
      const response = await runSimulation(scenarioData.settings);
      
      if (response.success && response.simulation) {
        // Update the scenario data with simulation results
        setScenarioData(prev => ({
          ...prev,
          simulation: response.simulation
        }));
        
        message.success('Simulation completed successfully');
        return response.simulation;
      } else {
        message.error('Simulation failed: ' + (response.error || 'Unknown error'));
        return null;
      }
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
      
      // Ensure scenario data exists
      if (!scenarioData) {
        message.error('No scenario data to save');
        return null;
      }
      
      // Update scenario name and description
      const updatedScenario = {
        ...scenarioData,
        name,
        description
      };
      
      // Prepare data for API
      const scenarioToSave = {
        name,
        description,
        settings: updatedScenario.settings
      };

      let response;
      if (currentScenario) {
        response = await updateScenario(currentScenario._id, scenarioToSave);
      } else {
        response = await createScenario(scenarioToSave);
      }

      if (response.success) {
        setScenarioData(updatedScenario);
        setCurrentScenario(response.data);
        message.success('Scenario saved successfully');
        return response.data;
      } else {
        message.error('Failed to save scenario: ' + (response.error || 'Unknown error'));
        return null;
      }
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
      
      if (response.success && response.data) {
        setScenarioData(response.data);
        setCurrentScenario(response.data);
        
        // Load location if it exists in the scenario
        if (response.data.settings?.project?.location) {
          setSelectedLocation({
            countryCode: response.data.settings.project.location,
            currency: response.data.settings.project.currency?.local || 'USD',
            foreignCurrency: response.data.settings.project.currency?.foreign || 'EUR',
            exchangeRate: response.data.settings.project.currency?.exchangeRate || 1.0,
            country: response.data.settings.project.location.toUpperCase()
          });
        } else {
          setSelectedLocation(null);
        }
        
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
  };

  // Provide access to both the full scenario data and the settings specifically
  const value = {
    scenarioData,
    settings: scenarioData?.settings || null,
    parameters: scenarioData?.settings || null, // For backward compatibility
    results: scenarioData?.simulation || null,
    loading,
    currentScenario,
    selectedLocation,
    setScenarioData,
    updateModuleParameters,
    loadDefaultParameters,
    runFullSimulation,
    saveCurrentScenario,
    loadScenario,
    setCurrentScenario,
    updateSelectedLocation,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};

export default ScenarioProvider;