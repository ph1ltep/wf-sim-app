// src/hooks/useModuleManager.js
import { useCallback } from 'react';
import { useScenario } from '../contexts/ScenarioContext';

export const useModuleManager = (moduleName) => {
  const { 
    scenarioData, 
    hasValidScenario, 
    updateModuleSettings, 
    updateByPath 
  } = useScenario();

  // Get current module data
  const moduleData = scenarioData?.settings?.modules?.[moduleName] || {};

  // Update the entire module
  const updateModule = useCallback((updates) => {
    return updateModuleSettings(moduleName, updates);
  }, [moduleName, updateModuleSettings]);

  // Update a specific property within the module
  const updateProperty = useCallback((propName, value) => {
    return updateByPath(['settings', 'modules', moduleName, propName], value);
  }, [moduleName, updateByPath]);

  // Update a nested property using a path relative to the module
  const updateNestedProperty = useCallback((path, value) => {
    const fullPath = ['settings', 'modules', moduleName, ...path];
    return updateByPath(fullPath, value);
  }, [moduleName, updateByPath]);

  return {
    data: moduleData,
    updateModule,
    updateProperty,
    updateNestedProperty
  };
};