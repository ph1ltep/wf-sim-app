// src/components/config/ProjectSettings.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { GlobalOutlined } from '@ant-design/icons';
import { getAllLocations } from '../../api/locations';

// Import project-specific components
import LocationSelector from './projectSettings/LocationSelector';
import ProjectMetrics from './projectSettings/ProjectMetrics';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  TextField,
  NumberField,
  SelectField,
  DateField,
  PercentageField,
  ResponsiveFieldRow,
  FormDivider,
  FieldGroup,
  CompactFieldGroup,
  FieldCard
} from '../contextFields';

const { Title } = Typography;

const ProjectSettings = () => {
  // Base paths for different parts of project settings
  const generalPath = ['settings', 'general'];
  const windFarmPath = ['settings', 'project', 'windFarm'];
  const currencyPath = ['settings', 'project', 'currency'];

  // Get scenario context
  const {
    scenarioData,
    getValueByPath,
    updateByPath,
    selectedLocation,
    updateSelectedLocation
  } = useScenario();

  // State to track fields from locations
  const [fieldsFromLocations, setFieldsFromLocations] = useState({
    capacityFactor: false,
    currency: false,
    foreignCurrency: false,
    exchangeRate: false
  });

  // State for locations
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Get calculated metrics from context (now calculated by metricsUtils)
  const calculatedMetrics = getValueByPath(['settings', 'metrics'], {});

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await getAllLocations();

        if (response.success && response.data) {
          setLocations(response.data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Handle location selection change
  const handleLocationChange = (locationId) => {
    const locationData = locations.find(loc => loc._id === locationId);
    if (locationData) {
      updateSelectedLocation(locationData);
    }
  };

  // Load location defaults
  const loadLocationDefaults = () => {
    if (!selectedLocation) return;

    // Prepare all updates in a single object
    const updates = {
      // Wind farm capacity factor
      [`${windFarmPath.join('.')}.capacityFactor`]: selectedLocation.capacityFactor,

      // Currency information
      [`${currencyPath.join('.')}.local`]: selectedLocation.currency,
      [`${currencyPath.join('.')}.foreign`]: selectedLocation.foreignCurrency,
      [`${currencyPath.join('.')}.exchangeRate`]: selectedLocation.exchangeRate,

      // Revenue module values
      'settings.modules.revenue.electricityPrice.parameters.value': selectedLocation.energyPrice,
      'settings.modules.revenue.electricityPrice.parameters.drift': selectedLocation.inflationRate,

      // Cost module values
      'settings.modules.cost.escalationRate.parameters.value': 1,
      'settings.modules.cost.escalationRate.parameters.drift': selectedLocation.inflationRate,

      // Financing module values (new WACC parameters)
      'settings.modules.financing.costOfConstructionDebt': selectedLocation.costOfConstructionDebt,
      'settings.modules.financing.costOfOperationalDebt': selectedLocation.costOfOperationalDebt,
      'settings.modules.financing.costOfEquity': selectedLocation.costofEquity,
      'settings.modules.financing.debtRatio': selectedLocation.debtRatio,
      'settings.modules.financing.effectiveTaxRate': selectedLocation.effectiveTaxRate
    };

    // Apply all updates in a single call
    updateByPath(updates)
      .then(result => {
        if (!result.isValid) {
          console.error('Error applying location defaults:', result.errors);
        } else {
          // Mark fields as being from location defaults
          setFieldsFromLocations({
            capacityFactor: true,
            currency: true,
            foreignCurrency: true,
            exchangeRate: true
          });
        }
      })
      .catch(error => {
        console.error('Error applying location defaults:', error);
      });
  };

  // Get currency options from currencyConstants
  const currencyOptions = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'JPY', label: 'Japanese Yen (JPY)' },
    { value: 'CHF', label: 'Swiss Franc (CHF)' },
    { value: 'CNY', label: 'Chinese Yuan (CNY)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' },
    { value: 'KRW', label: 'South Korean Won (KRW)' },
    { value: 'INR', label: 'Indian Rupee (INR)' },
    { value: 'TWD', label: 'Taiwan Dollar (TWD)' },
    { value: 'VND', label: 'Vietnamese Dong (VND)' },
    { value: 'THB', label: 'Thai Baht (THB)' },
    { value: 'MYR', label: 'Malaysian Ringgit (MYR)' },
    { value: 'IDR', label: 'Indonesian Rupiah (IDR)' },
    { value: 'PHP', label: 'Philippine Peso (PHP)' },
    { value: 'NZD', label: 'New Zealand Dollar (NZD)' },
    { value: 'SGD', label: 'Singapore Dollar (SGD)' }
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
        locations={locations}
        loading={loadingLocations}
        onLocationChange={handleLocationChange}
        onLoadDefaults={loadLocationDefaults}
      />

      {/* Project Identification */}
      <FieldCard >
        <FormSection title="Project Identification">
          <ResponsiveFieldRow layout="twoColumn">
            <TextField
              path={[...generalPath, 'projectName']}
              label="Project Name"
              tooltip="Name of the wind farm project"
              placeholder="e.g., Windward Valley Wind Farm"
              required
            />
            <DateField
              path={[...generalPath, 'startDate']}
              label="Project Start Date"
              required
            />
          </ResponsiveFieldRow>
        </FormSection>
        <FormDivider margin="small" orientation="left"></FormDivider>

        {/* Project Timeline */}
        <FormSection title="Project Timeline">
          <ResponsiveFieldRow layout="oneColumn">
            <NumberField
              path={[...generalPath, 'projectLife']}
              label="Project Life (Years)"
              tooltip="The total operational lifetime of the wind farm project"
              min={1}
              max={50}
              required
            />
          </ResponsiveFieldRow>
        </FormSection>
        <FormDivider margin="small" orientation="left"></FormDivider>
        {/* Currency Settings */}
        <FormSection title="Currency Settings">
          <CompactFieldGroup direction="vertical" size="middle">
            <SelectField
              path={[...currencyPath, 'local']}
              label={
                fieldsFromLocations.currency ?
                  <>Local Currency <GlobalOutlined style={{ color: '#1890ff' }} /></> :
                  "Local Currency"
              }
              options={currencyOptions}
              required
            />
            <SelectField
              path={[...currencyPath, 'foreign']}
              label={
                fieldsFromLocations.foreignCurrency ?
                  <>Foreign Currency <GlobalOutlined style={{ color: '#1890ff' }} /></> :
                  "Foreign Currency"
              }
              options={currencyOptions}
              required
            />
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
              required
            />
          </CompactFieldGroup>
        </FormSection>
        <FormDivider margin="small" orientation="left"></FormDivider>
        {/* Wind Farm Specifications */}
        <FormSection title="Wind Farm Specifications">
          <ResponsiveFieldRow layout="threeColumn">
            <NumberField
              path={[...windFarmPath, 'numWTGs']}
              label="Number of WTGs"
              tooltip="Number of wind turbine generators in the project"
              min={1}
              step={1}
              required
              affectedMetrics={['totalMW', 'grossAEP', 'netAEP', 'componentQuantities']}
            />
            <NumberField
              path={[...windFarmPath, 'mwPerWTG']}
              label="Megawatts per WTG"
              tooltip="Nameplate capacity of each wind turbine in megawatts"
              min={0.1}
              step={0.1}
              precision={2}
              required
              affectedMetrics={['totalMW', 'grossAEP', 'netAEP']}
            />
            <SelectField
              path={[...windFarmPath, 'wtgPlatformType']}
              label="WTG Platform Type"
              tooltip="Type of wind turbine generator platform"
              options={[
                { value: 'geared', label: 'Geared' },
                { value: 'direct-drive', label: 'Direct Drive' }
              ]}
              required
              affectedMetrics={['componentQuantities']}
            />
          </ResponsiveFieldRow>
          <ResponsiveFieldRow layout="oneColumn">
            <NumberField
              path={[...windFarmPath, 'capacityFactor']}
              label={
                fieldsFromLocations.capacityFactor ?
                  <>Capacity Factor (%) <GlobalOutlined style={{ color: '#1890ff' }} /></> :
                  "Capacity Factor (%)"
              }
              tooltip="Expected capacity factor as a percentage of nameplate capacity"
              min={1}
              max={60}
              step={0.5}
              precision={2}
              required
              affectedMetrics={['grossAEP', 'netAEP']}
            />
          </ResponsiveFieldRow>

          <FormDivider margin="small" orientation="left"></FormDivider>

          <ResponsiveFieldRow layout="twoColumn">
            <PercentageField
              path={[...windFarmPath, 'curtailmentLosses']}
              label="Curtailment Losses"
              tooltip="Energy losses due to grid curtailment or operational restrictions"
              min={0}
              max={30}
              step={0.5}
              precision={2}
              affectedMetrics={['netAEP']}
            />
            <PercentageField
              path={[...windFarmPath, 'electricalLosses']}
              label="Electrical Losses"
              tooltip="Energy losses in electrical systems, transformers, and transmission"
              min={0}
              max={15}
              step={0.5}
              precision={2}
              affectedMetrics={['netAEP']}
            />
          </ResponsiveFieldRow>
        </FormSection>
      </FieldCard>
      {/* Project Metrics */}
      <ProjectMetrics calculatedValues={calculatedMetrics} />
    </div>
  );
};

export default ProjectSettings;