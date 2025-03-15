// src/hooks/useProjectSettings.js
import { useState, useEffect, useCallback } from 'react';
import { useSimulation } from '../contexts/SimulationContext';
import { getAllLocations } from '../api/locations';
import { message } from 'antd';

/**
 * Custom hook for managing project settings data and operations
 */
const useProjectSettings = () => {
  const { parameters, updateModuleParameters, selectedLocation, updateSelectedLocation } = useSimulation();
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [fieldsFromLocations, setFieldsFromLocations] = useState({
    capacityFactor: false,
    currency: false,
    foreignCurrency: false,
    exchangeRate: false
  });
  const [calculatedMetrics, setCalculatedMetrics] = useState({
    totalMW: 0,
    grossAEP: 0,
    netAEP: 0,
    componentQuantities: {}
  });
  
  // Calculate project metrics and component quantities
  const calculateDerivedValues = useCallback((values) => {
    const numWTGs = values.numWTGs || 0;
    const mwPerWTG = values.mwPerWTG || 0;
    const capacityFactor = values.capacityFactor || 0;
    const curtailmentLosses = values.curtailmentLosses || 0;
    const electricalLosses = values.electricalLosses || 0;
    const wtgPlatformType = values.wtgPlatformType || 'geared';
    
    const totalMW = numWTGs * mwPerWTG;
    // Gross AEP = Total MW * Capacity Factor * Hours in a year
    const grossAEP = totalMW * (capacityFactor / 100) * 8760;
    
    // Net AEP after losses:
    // First apply curtailment losses
    const afterCurtailment = grossAEP * (1 - curtailmentLosses / 100);
    // Then apply electrical losses
    const netAEP = afterCurtailment * (1 - electricalLosses / 100);
    
    // Calculate major component quantities
    const componentQuantities = {
      blades: numWTGs * 3, // 3 blades per turbine
      bladeBearings: numWTGs * 3, // One bearing per blade
      transformers: numWTGs,
      // Different components based on platform type
      gearboxes: wtgPlatformType === 'geared' ? numWTGs : 0,
      generators: numWTGs,
      converters: numWTGs,
      mainBearings: numWTGs, // For both types, but different specifications
      yawSystems: numWTGs,
    };
    
    const updatedValues = {
      totalMW,
      grossAEP,
      netAEP,
      componentQuantities
    };
    
    setCalculatedMetrics(updatedValues);
    
    // Return calculated values without updating module parameters
    return updatedValues;
  }, []);
  
  // Separate function to update module parameters to avoid infinite loops
  const updateProjectMetrics = useCallback((metrics) => {
    updateModuleParameters('projectMetrics', metrics);
  }, [updateModuleParameters]);
  
  // Handle form values change
  const handleValuesChange = useCallback((changedValues, allValues) => {
    // Recalculate derived values
    const metrics = calculateDerivedValues(allValues);
    
    // Update module parameters (do this less frequently to avoid loops)
    updateProjectMetrics(metrics);
    
    // Check if any field loaded from locations was changed
    if (changedValues.capacityFactor && fieldsFromLocations.capacityFactor) {
      setFieldsFromLocations(prev => ({ ...prev, capacityFactor: false }));
    }
    
    if (changedValues.currency && fieldsFromLocations.currency) {
      setFieldsFromLocations(prev => ({ ...prev, currency: false }));
    }
    
    if (changedValues.foreignCurrency && fieldsFromLocations.foreignCurrency) {
      setFieldsFromLocations(prev => ({ ...prev, foreignCurrency: false }));
    }
    
    if (changedValues.exchangeRate && fieldsFromLocations.exchangeRate) {
      setFieldsFromLocations(prev => ({ ...prev, exchangeRate: false }));
    }
    
    // Check if currency related fields were changed
    const currencyFields = ['currency', 'foreignCurrency', 'exchangeRate'];
    
    // Create a copy of general parameters without currency fields
    const generalParams = { ...allValues };
    currencyFields.forEach(field => delete generalParams[field]);
    
    // Always update general parameters without currency fields
    updateModuleParameters('general', generalParams);
    
    // Handle currency field changes or ensure they persist in scenario parameters
    const scenarioParams = { 
      ...parameters?.scenario || {},
      currency: allValues.currency,
      foreignCurrency: allValues.foreignCurrency,
      exchangeRate: allValues.exchangeRate
    };
    
    // Update scenario parameters with currency info
    updateModuleParameters('scenario', scenarioParams);
    
    return metrics;
  }, [calculateDerivedValues, fieldsFromLocations, parameters, updateModuleParameters, updateProjectMetrics]);
  
  // Fetch available locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoadingLocations(true);
      const response = await getAllLocations();
      
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        message.error('Failed to load location data');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      message.error('Failed to load location data');
    } finally {
      setLoadingLocations(false);
    }
  }, []);
  
  // Handle location selection change
  const handleLocationChange = useCallback(async (locationId) => {
    // Find the location data for the selected ID
    const locationData = locations.find(loc => loc._id === locationId);
    if (locationData) {
      updateSelectedLocation(locationData);
    }
  }, [locations, updateSelectedLocation]);
  
  // Load location defaults
  const loadLocationDefaults = useCallback(async (form) => {
    if (!selectedLocation?._id) {
      message.warning('Please select a location first');
      return false;
    }

    // The selected location is already available in the context
    const locationData = selectedLocation;
    
    // Update form values with location defaults
    const formValues = form.getFieldsValue();
    
    // Update capacity factor
    formValues.capacityFactor = locationData.capacityFactor;
    
    // Update currency information
    formValues.currency = locationData.currency;
    formValues.foreignCurrency = locationData.foreignCurrency;
    formValues.exchangeRate = locationData.exchangeRate;
    
    // Update the form with these values
    form.setFieldsValue(formValues);
    
    // Update the general parameters (without currency)
    const generalParams = { ...formValues };
    delete generalParams.currency;
    delete generalParams.foreignCurrency;
    delete generalParams.exchangeRate;
    updateModuleParameters('general', generalParams);
    
    // Recalculate derived values
    const metrics = calculateDerivedValues(generalParams);
    updateProjectMetrics(metrics);

    // Update revenue module values with location defaults
    if (parameters?.revenue) {
      const revenueParams = { ...parameters.revenue };
      
      // Update electricity price
      if (revenueParams.electricityPrice) {
        revenueParams.electricityPrice.value = locationData.energyPrice;
      }
      
      // Update module parameters
      updateModuleParameters('revenue', revenueParams);
    }

    // Update cost module values with location defaults (inflation rate for escalation)
    if (parameters?.cost) {
      const costParams = { ...parameters.cost };
      
      // Update escalation rate to match inflation rate
      costParams.escalationRate = locationData.inflationRate;
      
      // Update module parameters
      updateModuleParameters('cost', costParams);
    }

    // Update the scenario with currency information and location
    const scenarioParams = { 
      ...parameters?.scenario || {},
      location: locationData.countryCode,
      currency: locationData.currency,
      foreignCurrency: locationData.foreignCurrency,
      exchangeRate: locationData.exchangeRate
    };
    
    updateModuleParameters('scenario', scenarioParams);
    
    // Mark fields as being from location defaults
    setFieldsFromLocations({
      capacityFactor: true,
      currency: true,
      foreignCurrency: true,
      exchangeRate: true
    });

    message.success(`Loaded defaults for ${locationData.country}`);
    return true;
  }, [selectedLocation, calculateDerivedValues, parameters, updateModuleParameters, updateProjectMetrics]);
  
  // Initialize data on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  
  // Calculate initial metrics when parameters change
  useEffect(() => {
    if (parameters?.general) {
      calculateDerivedValues(parameters.general);
      // Don't update module parameters here to avoid loops
    }
  }, [parameters?.general, calculateDerivedValues]);
  
  return {
    locations,
    selectedLocation,
    loadingLocations,
    fieldsFromLocations,
    calculatedMetrics,
    handleLocationChange,
    loadLocationDefaults,
    handleValuesChange,
    calculateDerivedValues
  };
};

export default useProjectSettings;