// src/contexts/SimulationContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDefaultParameters, runSimulation } from '../api/simulation';
import { createScenario, updateScenario, getScenarioById } from '../api/scenarios';
import { getOEMContractById } from '../api/oemContracts';
import { message } from 'antd';
import moment from 'moment';

const SimulationContext = createContext();

export const useSimulation = () => useContext(SimulationContext);

export const SimulationProvider = ({ children }) => {
  const [parameters, setParameters] = useState(null);
  const [results, setResults] = useState(null);
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
      setParameters(response.defaults);
    } catch (err) {
      message.error('Failed to load default parameters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateModuleParameters = (moduleName, newParams) => {
    setParameters(prev => {
      if (!prev) return prev;
      
      // Handle date fields specifically - convert moment objects to ISO strings
      const processedParams = { ...newParams };
      if (moduleName === 'general' && processedParams.startDate && moment.isMoment(processedParams.startDate)) {
        processedParams.startDate = processedParams.startDate.toISOString();
      }
      
      // Handle special case for componentQuantities that should go into projectMetrics
      if (moduleName === 'general' && processedParams.componentQuantities) {
        const { componentQuantities, ...generalParams } = processedParams;
        
        return {
          ...prev,
          [moduleName]: {
            ...prev[moduleName],
            ...generalParams,
          },
          projectMetrics: {
            ...prev.projectMetrics,
            componentQuantities: componentQuantities,
          }
        };
      }
      
      return {
        ...prev,
        [moduleName]: {
          ...prev[moduleName],
          ...processedParams,
        },
      };
    });
  };

  // Update the selected location
  const updateSelectedLocation = (locationData) => {
    setSelectedLocation(locationData);
    
    // Also update the scenario location information in parameters
    if (locationData) {
      updateModuleParameters('scenario', { 
        ...parameters?.scenario || {},
        location: locationData.countryCode,
        currency: locationData.currency,
        foreignCurrency: locationData.foreignCurrency,
        exchangeRate: locationData.exchangeRate
      });
    }
  };

  const loadOEMContractDetails = async (contractId) => {
    if (!contractId) return null;
    
    try {
      const response = await getOEMContractById(contractId);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error loading OEM contract details:', error);
      return null;
    }
  };

  const runFullSimulation = async () => {
    if (!parameters) {
      message.warning('Parameters not yet loaded.');
      return;
    }

    try {
      setLoading(true);
      
      // Clone parameters to avoid mutating the state directly
      const simulationParams = JSON.parse(JSON.stringify(parameters));
      
      // If there's an OEM contract selected, load its details
      if (simulationParams.cost?.oemContractId) {
        const contractDetails = await loadOEMContractDetails(simulationParams.cost.oemContractId);
        
        if (contractDetails) {
          // Update cost parameters with contract details
          simulationParams.cost.fixedOMFee = contractDetails.isPerTurbine ? 
            contractDetails.fixedFee * simulationParams.general.numWTGs : 
            contractDetails.fixedFee;
          simulationParams.cost.oemTerm = contractDetails.endYear;
        }
      }
      
      const response = await runSimulation(simulationParams);
      
      // Store the percentile information from results
      if (response.percentileInfo) {
        updateModuleParameters('probabilities', response.percentileInfo);
      }
      
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
      
      // Ensure the current parameters have the scenario name and description
      if (parameters.scenario) {
        parameters.scenario.name = name;
        parameters.scenario.description = description;
      } else {
        parameters.scenario = { name, description };
      }
      
      // Convert moment objects to ISO strings for saving
      const preparedParameters = JSON.parse(JSON.stringify(parameters));
      
      const scenarioData = {
        name,
        description,
        parameters: preparedParameters
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
      
      // Get the scenario parameters
      const scenarioParams = response.scenario.parameters;
      
      setParameters(scenarioParams);
      setCurrentScenario(response.scenario);
      setResults(response.scenario.results);
      
      // Load location if it exists in the scenario
      if (scenarioParams.scenario && scenarioParams.scenario.location) {
        setSelectedLocation({
          countryCode: scenarioParams.scenario.location,
          currency: scenarioParams.scenario.currency || 'USD',
          foreignCurrency: scenarioParams.scenario.foreignCurrency || 'EUR',
          exchangeRate: scenarioParams.scenario.exchangeRate || 1.0,
          country: scenarioParams.scenario.location.toUpperCase()
        });
      }
      
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

  const updateProjectMetrics = (metrics) => {
    setParameters(prev => ({
      ...prev,
      projectMetrics: {
        ...prev.projectMetrics,
        ...metrics
      }
    }));
  };

  const value = {
    parameters,
    results,
    loading,
    currentScenario,
    selectedLocation,
    setParameters,
    updateModuleParameters,
    loadDefaultParameters,
    runFullSimulation,
    saveCurrentScenario,
    loadScenario,
    setCurrentScenario,
    updateProjectMetrics,
    updateSelectedLocation,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export default SimulationProvider;