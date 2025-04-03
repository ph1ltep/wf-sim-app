// src/components/config/ProjectSettings.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { GlobalOutlined } from '@ant-design/icons';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  TextField,
  NumberField,
  SelectField,
  DateField,
  PercentageField
} from '../contextFields';

// Import project-specific components
import LocationSelector from './projectSettings/LocationSelector';
import ProjectMetrics from './projectSettings/ProjectMetrics';

const { Title } = Typography;

const ProjectSettings = () => {
  // Base paths for different parts of project settings
  const generalPath = ['settings', 'general'];
  const windFarmPath = ['settings', 'project', 'windFarm'];
  const currencyPath = ['settings', 'project', 'currency'];

  // State for calculated metrics
  const [calculatedMetrics, setCalculatedMetrics] = useState({
    totalMW: 0,
    grossAEP: 0,
    netAEP: 0,
    componentQuantities: {}
  });

  // Get scenario context
  const { scenarioData, getValueByPath, selectedLocation, updateByPath } = useScenario();
  
  // State to track fields from locations
  const [fieldsFromLocations, setFieldsFromLocations] = useState({
    capacityFactor: false,
    currency: false,
    foreignCurrency: false,
    exchangeRate: false
  });

  // Calculate metrics when relevant values change
  useEffect(() => {
    if (scenarioData) {
      const numWTGs = getValueByPath([...windFarmPath, 'numWTGs'], 0);
      const mwPerWTG = getValueByPath([...windFarmPath, 'mwPerWTG'], 0);
      const capacityFactor = getValueByPath([...windFarmPath, 'capacityFactor'], 0);
      const curtailmentLosses = getValueByPath([...windFarmPath, 'curtailmentLosses'], 0);
      const electricalLosses = getValueByPath([...windFarmPath, 'electricalLosses'], 0);
      const wtgPlatformType = getValueByPath([...windFarmPath, 'wtgPlatformType'], 'geared');
      
      const totalMW = numWTGs * mwPerWTG;
      const grossAEP = totalMW * (capacityFactor / 100) * 8760;
      
      const afterCurtailment = grossAEP * (1 - curtailmentLosses / 100);
      const netAEP = afterCurtailment * (1 - electricalLosses / 100);
      
      const componentQuantities = {
        blades: numWTGs * 3,
        bladeBearings: numWTGs * 3,
        transformers: numWTGs,
        gearboxes: wtgPlatformType === 'geared' ? numWTGs : 0,
        generators: numWTGs,
        converters: numWTGs,
        mainBearings: numWTGs,
        yawSystems: numWTGs,
      };
      
      setCalculatedMetrics({
        totalMW,
        grossAEP,
        netAEP,
        componentQuantities
      });
      
      // Update metrics in context
      updateByPath(['settings', 'metrics'], {
        totalMW,
        grossAEP,
        netAEP,
        componentQuantities
      });
    }
  }, [scenarioData, getValueByPath, updateByPath]);

  // Load location defaults
  const loadLocationDefaults = () => {
    if (!selectedLocation) return;
    
    // Update capacity factor
    updateByPath([...windFarmPath, 'capacityFactor'], selectedLocation.capacityFactor);
    
    // Update currency information
    updateByPath([...currencyPath, 'local'], selectedLocation.currency);
    updateByPath([...currencyPath, 'foreign'], selectedLocation.foreignCurrency);
    updateByPath([...currencyPath, 'exchangeRate'], selectedLocation.exchangeRate);
    
    // Update revenue module values with location defaults
    updateByPath(['settings', 'modules', 'revenue', 'electricityPrice', 'value'], 
                 selectedLocation.energyPrice);
    
    // Update cost module values with location defaults
    updateByPath(['settings', 'modules', 'cost', 'escalationRate'], 
                 selectedLocation.inflationRate);
    
    // Mark fields as being from location defaults
    setFieldsFromLocations({
      capacityFactor: true,
      currency: true,
      foreignCurrency: true,
      exchangeRate: true
    });
  };

  // Get currency options from currencyConstants
  const currencyOptions = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'JPY', label: 'Japanese Yen (JPY)' },
    { value: 'CNY', label: 'Chinese Yuan (CNY)' },
    // More currencies would be here
  ];

  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Project Specifics</Title>
        <Alert 
          message="No Active Scenario" 
          description="Please create or load a scenario first." 
          type="warning" 
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Project Specifics</Title>
      <p>Configure the basic parameters for your wind farm project.</p>

      {/* Location selection */}
      <LocationSelector
        selectedLocation={selectedLocation}
        onLoadDefaults={loadLocationDefaults}
      />

      {/* Project Identification */}
      <FormSection title="Project Identification">
        <FormRow>
          <FormCol span={16}>
            <TextField
              path={[...generalPath, 'projectName']}
              label="Project Name"
              tooltip="Name of the wind farm project"
              placeholder="e.g., Windward Valley Wind Farm"
            />
          </FormCol>
          <FormCol span={8}>
            <DateField
              path={[...generalPath, 'startDate']}
              label="Project Start Date"
            />
          </FormCol>
        </FormRow>
      </FormSection>
      
      {/* Project Timeline */}
      <FormSection title="Project Timeline">
        <FormRow>
          <FormCol span={8}>
            <NumberField
              path={[...generalPath, 'projectLife']}
              label="Project Life (Years)"
              tooltip="The total operational lifetime of the wind farm project"
              min={1}
              max={50}
            />
          </FormCol>
        </FormRow>
      </FormSection>
      
      {/* Currency Settings */}
      <FormSection title="Currency Settings">
        <FormRow>
          <FormCol span={8}>
            <SelectField
              path={[...currencyPath, 'local']}
              label={
                fieldsFromLocations.currency ? 
                <>Local Currency <GlobalOutlined style={{ color: '#1890ff' }} /></> : 
                "Local Currency"
              }
              options={currencyOptions}
            />
          </FormCol>
          <FormCol span={8}>
            <SelectField
              path={[...currencyPath, 'foreign']}
              label={
                fieldsFromLocations.foreignCurrency ? 
                <>Foreign Currency <GlobalOutlined style={{ color: '#1890ff' }} /></> : 
                "Foreign Currency"
              }
              options={currencyOptions}
            />
          </FormCol>
          <FormCol span={8}>
            <NumberField
              path={[...currencyPath, 'exchangeRate']}
              label={
                fieldsFromLocations.exchangeRate ? 
                <>Foreign/Local Exchange Rate <GlobalOutlined style={{ color: '#1890ff' }} /></> : 
                "Foreign/Local Exchange Rate"
              }
              tooltip="Enter rate as: 1 foreign currency = ? local currency"
              min={0}
              step={0.01}
            />
          </FormCol>
        </FormRow>
      </FormSection>
      
      {/* Wind Farm Specifications */}
      <FormSection title="Wind Farm Specifications">
        <FormRow>
          <FormCol span={8}>
            <NumberField
              path={[...windFarmPath, 'numWTGs']}
              label="Number of WTGs"
              tooltip="Number of wind turbine generators in the project"
              min={1}
              step={1}
            />
          </FormCol>
          <FormCol span={8}>
            <NumberField
              path={[...windFarmPath, 'mwPerWTG']}
              label="Megawatts per WTG"
              tooltip="Nameplate capacity of each wind turbine in megawatts"
              min={0.1}
              step={0.1}
              precision={2}
            />
          </FormCol>
          <FormCol span={8}>
            <SelectField
              path={[...windFarmPath, 'wtgPlatformType']}
              label="WTG Platform Type"
              tooltip="Type of wind turbine generator platform"
              options={[
                { value: 'geared', label: 'Geared' },
                { value: 'direct-drive', label: 'Direct Drive' }
              ]}
            />
          </FormCol>
        </FormRow>
        
        <FormRow>
          <FormCol span={8}>
            <PercentageField
              path={[...windFarmPath, 'capacityFactor']}
              label={
                fieldsFromLocations.capacityFactor ? 
                <>Capacity Factor <GlobalOutlined style={{ color: '#1890ff' }} /></> : 
                "Capacity Factor"
              }
              tooltip="Expected capacity factor as a percentage of nameplate capacity"
              min={1}
              max={60}
              step={0.5}
              precision={1}
            />
          </FormCol>
        </FormRow>
        
        <FormRow>
          <FormCol span={12}>
            <PercentageField
              path={[...windFarmPath, 'curtailmentLosses']}
              label="Curtailment Losses"
              tooltip="Energy losses due to grid curtailment or operational restrictions"
              min={0}
              max={30}
              step={0.5}
              precision={1}
            />
          </FormCol>
          <FormCol span={12}>
            <PercentageField
              path={[...windFarmPath, 'electricalLosses']}
              label="Electrical Losses"
              tooltip="Energy losses in electrical systems, transformers, and transmission"
              min={0}
              max={15}
              step={0.5}
              precision={1}
            />
          </FormCol>
        </FormRow>
      </FormSection>
      
      {/* Project Metrics */}
      <ProjectMetrics calculatedValues={calculatedMetrics} />
    </div>
  );
};

export default ProjectSettings;