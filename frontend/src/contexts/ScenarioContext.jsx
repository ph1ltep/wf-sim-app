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
      
      // Validate the input
      if (!id) {
        throw new Error('No scenario ID provided');
      }
      
      console.log(`Updating scenario ${id} with:`, JSON.stringify(data, null, 2));
      
      // Create a sanitized copy of the data to send
      const sanitizedData = {};
      
      // Only include specific fields that the backend allows
      if (data.name !== undefined) sanitizedData.name = data.name;
      if (data.description !== undefined) sanitizedData.description = data.description;
      
      // For settings, do a deeper check
      if (data.settings) {
        // Make a deep copy to avoid reference issues
        sanitizedData.settings = JSON.parse(JSON.stringify(data.settings));
      }
      
      console.log("Sanitized data to send:", JSON.stringify(sanitizedData, null, 2));
      
      // Make the API call
      const response = await api.put(`/scenarios/${id}`, sanitizedData);
      
      if (response.success && response.data) {
        // If we're updating the currently loaded scenario, update the local state
        if (scenarioData && scenarioData._id === id) {
          setScenarioData(prevData => {
            // Create a new object with the updated fields
            const updatedScenario = {
              ...prevData,
              ...response.data
            };
            
            // If the update included settings, update those too
            if (data.settings) {
              updatedScenario.settings = {
                ...prevData.settings,
                ...data.settings
              };
            }
            
            return updatedScenario;
          });
        }
        
        message.success('Scenario updated successfully');
        return response.data;
      } else {
        console.error('API returned success: false', response);
        message.error('Failed to update scenario: ' + (response.error || 'Unknown error'));
        return null;
      }
    } catch (err) {
      console.error('Error in updateScenario:', err);
      
      // Better error message based on the response
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      message.error('Failed to update scenario: ' + errorMessage);
      
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