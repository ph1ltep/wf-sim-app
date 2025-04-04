// src/hooks/useProjectSettings.js
import { useState, useEffect, useCallback } from 'react';
import { useScenario } from '../contexts/ScenarioContext';
import { getAllLocations } from '../api/locations';
import { message } from 'antd';

/**
 * Custom hook for managing project settings data and operations
 */
const useProjectSettings = () => {
  const { 
    scenarioData, 
    updateByPath, 
    updateModuleParameters,
    selectedLocation, 
    updateSelectedLocation 
  } = useScenario();
  
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
    
    // Return calculated values
    return updatedValues;
  }, []);
  
  // Handle form values change
  const handleValuesChange = useCallback((changedValues, allValues) => {
    // Extract special fields (projectName, startDate) from allValues
    const { projectName, startDate, projectLife, ...otherValues } = allValues;
    
    // Recalculate derived values
    calculateDerivedValues(otherValues);
    
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
    
    // Update general settings
    if (changedValues.projectName || changedValues.startDate || changedValues.projectLife) {
      const generalParams = {};
      if (changedValues.projectName) generalParams.projectName = projectName;
      if (changedValues.startDate) generalParams.startDate = startDate;
      if (changedValues.projectLife) generalParams.projectLife = projectLife;
      
      updateModuleParameters('general', generalParams);
    }
    
    // Update wind farm settings
    const windFarmParams = {
      numWTGs: allValues.numWTGs,
      mwPerWTG: allValues.mwPerWTG,
      capacityFactor: allValues.capacityFactor,
      wtgPlatformType: allValues.wtgPlatformType,
      curtailmentLosses: allValues.curtailmentLosses,
      electricalLosses: allValues.electricalLosses
    };
    
    if (Object.keys(changedValues).some(key => 
      ['numWTGs', 'mwPerWTG', 'capacityFactor', 'wtgPlatformType', 'curtailmentLosses', 'electricalLosses'].includes(key)
    )) {
      updateModuleParameters('windFarm', windFarmParams);
    }
    
    // Update currency settings
    if (changedValues.currency || changedValues.foreignCurrency || changedValues.exchangeRate) {
      const currencyParams = {
        currency: allValues.currency,
        foreignCurrency: allValues.foreignCurrency,
        exchangeRate: allValues.exchangeRate
      };
      
      updateModuleParameters('currency', currencyParams);
    }
    
    // Calculate metrics and update
    const metrics = calculateDerivedValues(otherValues);
    updateModuleParameters('metrics', metrics);
    
    return metrics;
  }, [calculateDerivedValues, fieldsFromLocations, updateModuleParameters]);
  
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
  const loadLocationDefaults = useCallback((form) => {
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
    
    // Update wind farm settings
    const windFarmParams = {
      capacityFactor: locationData.capacityFactor
    };
    updateModuleParameters('windFarm', windFarmParams);
    
    // Recalculate derived values
    const metrics = calculateDerivedValues(formValues);
    updateModuleParameters('metrics', metrics);

    // Update scenario with currency information and location
    const currencyParams = { 
      currency: locationData.currency,
      foreignCurrency: locationData.foreignCurrency,
      exchangeRate: locationData.exchangeRate
    };
    
    updateModuleParameters('currency', currencyParams);
    
    // Mark fields as being from location defaults
    setFieldsFromLocations({
      capacityFactor: true,
      currency: true,
      foreignCurrency: true,
      exchangeRate: true
    });

    // Update revenue module values with location defaults
    if (scenarioData?.settings?.modules?.revenue) {
      const revenueParams = { ...scenarioData.settings.modules.revenue };
      
      // Update electricity price
      if (revenueParams.electricityPrice) {
        revenueParams.electricityPrice.value = locationData.energyPrice;
      }
      
      // Update module parameters
      updateModuleParameters('revenue', revenueParams);
    }

    // Update cost module values with location defaults (inflation rate for escalation)
    if (scenarioData?.settings?.modules?.cost) {
      const costParams = { ...scenarioData.settings.modules.cost };
      
      // Update escalation rate to match inflation rate
      costParams.escalationRate = locationData.inflationRate;
      
      // Update module parameters
      updateModuleParameters('cost', costParams);
    }

    message.success(`Loaded defaults for ${locationData.country}`);
    return true;
  }, [selectedLocation, calculateDerivedValues, scenarioData, updateModuleParameters]);
  
  // Initialize data on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  
  // Calculate initial metrics when settings change
  useEffect(() => {
    if (scenarioData?.settings?.project?.windFarm) {
      calculateDerivedValues(scenarioData.settings.project.windFarm);
    }
  }, [scenarioData, calculateDerivedValues]);
  
  return {
    locations,
    loadingLocations,
    selectedLocation,
    fieldsFromLocations,
    calculatedMetrics,
    handleLocationChange,
    loadLocationDefaults,
    handleValuesChange,
    calculateDerivedValues
  };
};

export default useProjectSettings;