// src/components/config/ProjectSettings.jsx
import React, { useEffect } from 'react';
import { Typography, Form, Button, Row, Col } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';

// Custom hook for project settings
import useProjectSettings from '../../hooks/useProjectSettings';

// Component imports
import LocationSelector from './projectSettings/LocationSelector';
import ProjectTimeline from './projectSettings/ProjectTimeline';
import CurrencySettings from './projectSettings/CurrencySettings';
import WindFarmSpecifications from './projectSettings/WindFarmSpecifications';
import ProjectMetrics from './projectSettings/ProjectMetrics';

const { Title } = Typography;

const ProjectSettings = () => {
  const { parameters } = useSimulation();
  const [form] = Form.useForm();
  
  // Use the custom hook for project settings
  const {
    locations,
    selectedLocation,
    loadingLocations,
    fieldsFromLocations,
    calculatedMetrics,
    handleLocationChange,
    loadLocationDefaults,
    handleValuesChange,
    calculateDerivedValues
  } = useProjectSettings();

  // Initialize form values
  useEffect(() => {
    if (parameters && parameters.general) {
      // Get the general parameters
      const generalParams = { ...parameters.general };
      
      // Get currency settings from scenario parameters or use defaults
      const currencySettings = parameters.scenario || {};
      
      const initialValues = {
        ...generalParams,
        currency: currencySettings.currency || 'USD',
        foreignCurrency: currencySettings.foreignCurrency || 'EUR',
        exchangeRate: currencySettings.exchangeRate || 1.0
      };
      
      form.setFieldsValue(initialValues);
    }
  }, [form, parameters]);

  // Handle form values change
  const onValuesChange = (changedValues, allValues) => {
    handleValuesChange(changedValues, allValues);
  };

  // Handle loading location defaults
  const onLoadLocationDefaults = () => {
    loadLocationDefaults(form);
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    
    // Recalculate with reset values
    const values = form.getFieldsValue();
    calculateDerivedValues(values);
  };

  // If parameters are not loaded yet, show loading indicator
  if (!parameters || !parameters.general) {
    return <div>Loading parameters...</div>;
  }

  return (
    <div>
      <Title level={2}>Project Specifics</Title>
      <p>Configure the basic parameters for your wind farm project.</p>

      {/* Location selection */}
      <LocationSelector
        locations={locations}
        selectedLocation={selectedLocation}
        loading={loadingLocations}
        onLocationChange={handleLocationChange}
        onLoadDefaults={onLoadLocationDefaults}
      />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
      >
        {/* Project Timeline */}
        <ProjectTimeline />
        
        {/* Currency Settings */}
        <CurrencySettings fieldsFromLocations={fieldsFromLocations} />
        
        {/* Wind Farm Specifications */}
        <WindFarmSpecifications fieldsFromLocations={fieldsFromLocations} />
        
        {/* Project Metrics */}
        <ProjectMetrics calculatedValues={calculatedMetrics} />

        {/* Reset Button */}
        <Row justify="end" style={{ marginTop: 16 }}>
          <Col>
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ProjectSettings;