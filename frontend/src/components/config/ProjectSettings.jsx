// src/components/config/ProjectSettings.jsx
import React, { useEffect } from 'react';
import { Typography, Form, Input, Button, Row, Col, DatePicker } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import moment from 'moment';

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
  const { settings } = useScenario();
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
    if (settings && settings.general) {
      // Get the general parameters
      const generalParams = { ...settings.general };
      
      // Get wind farm settings
      const windFarmParams = settings.project?.windFarm || {};
      
      // Get currency settings
      const currencySettings = settings.project?.currency || {};
      
      // Parse the date if it exists
      let startDate = generalParams.startDate ? moment(generalParams.startDate) : null;
      
      const initialValues = {
        ...generalParams,
        ...windFarmParams,
        projectName: generalParams.projectName || 'Wind Farm Project',
        startDate: startDate,
        projectLife: generalParams.projectLife || 20,
        currency: currencySettings.local || 'USD',
        foreignCurrency: currencySettings.foreign || 'EUR',
        exchangeRate: currencySettings.exchangeRate || 1.0
      };
      
      form.setFieldsValue(initialValues);
    }
  }, [form, settings]);

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    
    // Recalculate with reset values
    const values = form.getFieldsValue();
    calculateDerivedValues(values);
  };

  // If settings are not loaded yet, show loading indicator
  if (!settings) {
    return <div>Loading settings...</div>;
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
        onLoadDefaults={loadLocationDefaults}
      />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        {/* Project Identification */}
        <Form.Item
          label="Project Name"
          name="projectName"
          rules={[{ required: true, message: 'Please input project name!' }]}
        >
          <Input placeholder="e.g., Windward Valley Wind Farm" />
        </Form.Item>
        
        <Form.Item
          label="Project Start Date"
          name="startDate"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      
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