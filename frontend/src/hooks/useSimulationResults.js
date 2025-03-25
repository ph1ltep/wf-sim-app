// src/hooks/useSimulationResults.js
import { useCallback } from 'react';
import { useScenario } from '../contexts/ScenarioContext';

export const useSimulationResults = () => {
  const { 
    scenarioData, 
    hasValidScenario, 
    updateSimulationResults, 
    updateByPath 
  } = useScenario();

  // Extract simulation results
  const simulation = scenarioData?.simulation || {};
  const inputSim = simulation.inputSim || {};
  const outputSim = simulation.outputSim || {};

  // Update input simulation results
  const updateInputSim = useCallback((updates) => {
    return updateSimulationResults({ inputSim: updates });
  }, [updateSimulationResults]);

  // Update output simulation results
  const updateOutputSim = useCallback((updates) => {
    return updateSimulationResults({ outputSim: updates });
  }, [updateSimulationResults]);

  // Update a specific part of the simulation results
  const updateSimulationPart = useCallback((simType, path, value) => {
    const fullPath = ['simulation', simType, ...path];
    return updateByPath(fullPath, value);
  }, [updateByPath]);

  // Helper to extract percentile data
  const getPercentileData = useCallback((path, percentileType = 'Pprimary') => {
    let current = simulation;
    
    for (const segment of path) {
      if (!current || !current[segment]) return null;
      current = current[segment];
    }
    
    return current[percentileType] || null;
  }, [simulation]);

  return {
    simulation,
    inputSim,
    outputSim,
    updateInputSim,
    updateOutputSim,
    updateSimulationPart,
    getPercentileData
  };
};