// src/contexts/ScenarioContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import api from '../api/index';

const ScenarioContext = createContext();

export const useScenario = () => useContext(ScenarioContext);

export const ScenarioProvider = ({ children }) => {
  const [scenarioData, setScenarioData] = useState(null);
  const [scenarioList, setScenarioList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Initialize by creating a new scenario on mount
  useEffect(() => {
    initializeScenario();
  }, []);

  // Create a new scenario with default parameters
  const initializeScenario = async () => {
    try {
      setLoading(true);
      
      // Create a new scenario with default settings
      const response = await api.post('/scenarios', {
        name: 'New Scenario',
        description: 'Default configuration scenario'
      });
      
      if (response.success && response.data) {
        setScenarioData(response.data);
        message.success('Scenario initialized successfully');
      } else {
        message.error('Failed to initialize scenario: ' + (response.error || 'Unknown error'));
        console.error('Failed to initialize scenario:', response);
      }
    } catch (err) {
      message.error('Failed to initialize scenario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get a specific scenario by ID
  const getScenario = async (id) => {
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
  };

  // Get all scenarios (with optional pagination)
  const getAllScenarios = async (page = 1, limit = 10) => {
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
  };

  // Update a scenario
  const updateScenario = async (id, data) => {
    try {
      setLoading(true);
      const response = await api.put(`/scenarios/${id}`, data);
      
      if (response.success && response.data) {
        // If we're updating the currently loaded scenario, update the local state
        if (scenarioData && scenarioData._id === id) {
          setScenarioData({
            ...scenarioData,
            ...response.data,
            // Preserve any fields not returned by the update endpoint
            settings: data.settings || scenarioData.settings,
            simulation: scenarioData.simulation
          });
        }
        
        message.success('Scenario updated successfully');
        return response.data;
      } else {
        message.error('Failed to update scenario: ' + (response.error || 'Unknown error'));
        return null;
      }
    } catch (err) {
      message.error('Failed to update scenario');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a scenario
  const deleteScenario = async (id) => {
    try {
      setLoading(true);
      const response = await api.delete(`/scenarios/${id}`);
      
      if (response.success) {
        // If the deleted scenario is currently loaded, clear it
        if (scenarioData && scenarioData._id === id) {
          setScenarioData(null);
          // Optionally initialize a new one
          initializeScenario();
        }
        
        // Update the scenario list
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
  };

  // Provide context values
  const value = {
    scenarioData,
    scenarioList,
    settings: scenarioData?.settings || null,
    results: scenarioData?.simulation || null,
    loading,
    selectedLocation,
    setSelectedLocation,
    initializeScenario,
    getScenario,
    getAllScenarios,
    updateScenario,
    deleteScenario,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};

export default ScenarioProvider;