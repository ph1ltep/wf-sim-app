// frontend/src/pages/config/project/ProjectSettings.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';
import { GlobalOutlined } from '@ant-design/icons';
import { getAllLocations } from 'api/locations';

// Import project-specific components
import LocationSelector from 'components/forms/selectors/LocationSelector';

// Import context field components
import {
  FormSection,
  TextField,
  NumberField,
  SelectField,
  DateField,
  ResponsiveFieldRow,
  FormDivider,
  CompactFieldGroup,
  FieldCard
} from 'components/contextFields';

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
    currency: false,
    foreignCurrency: false,
    exchangeRate: false
  });

  // State for locations
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

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

  // Calculate timeline metrics when dates change
  useEffect(() => {
    const updateTimelineMetrics = async () => {
      if (!scenarioData) return;

      const codDate = getValueByPath([...windFarmPath, 'codDate']);
      const ntpDate = getValueByPath([...windFarmPath, 'ntpDate']);
      const devDate = getValueByPath([...windFarmPath, 'devDate']);

      if (codDate) {
        const updates = {};
        const codYear = codDate.getFullYear();

        if (devDate) {
          const devStartYear = devDate.getFullYear() - codYear;
          updates['settings.metrics.developmentStartYear'] = devStartYear;
        }

        if (ntpDate) {
          const ntpYear = ntpDate.getFullYear() - codYear;
          updates['settings.metrics.ntpYear'] = ntpYear;
        }

        if (Object.keys(updates).length > 0) {
          try {
            await updateByPath(updates);
          } catch (error) {
            console.error('Error updating timeline metrics:', error);
          }
        }
      }
    };

    updateTimelineMetrics();
  }, [scenarioData, getValueByPath, updateByPath]);

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
        <Title level={2}>Project Settings</Title>
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
      <Title level={2}>Project Settings</Title>
      <p>Configure the fundamental parameters for your wind farm project.</p>

      {/* Location selection */}
      <LocationSelector
        selectedLocation={selectedLocation}
        locations={locations}
        loading={loadingLocations}
        onLocationChange={handleLocationChange}
        onLoadDefaults={loadLocationDefaults}
      />

      {/* Project Configuration */}
      <FieldCard>
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

        <FormDivider margin="small" orientation="left" />

        {/* Project Timeline */}
        <FormSection title="Project Timeline">
          <ResponsiveFieldRow layout="twoColumn">
            <CompactFieldGroup direction="vertical" size="middle">
              <DateField
                path={[...windFarmPath, 'devDate']}
                label="Development Start Date"
                tooltip="When development activities begin"
                required
                affectedMetrics={['devYear']}
              />
              <DateField
                path={[...windFarmPath, 'ntpDate']}
                label="Notice to Proceed (NTP)"
                tooltip="When construction can begin"
                required
                affectedMetrics={['ntpYear']}
              />
              <DateField
                path={[...windFarmPath, 'codDate']}
                label="Commercial Operation Date (COD)"
                tooltip="When the project begins commercial operation"
                required
                affectedMetrics={['developmentStartYear', 'ntpYear']}
              />
            </CompactFieldGroup>
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

        <FormDivider margin="small" orientation="left" />

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
      </FieldCard>
    </div>
  );
};

export default ProjectSettings;