// src/components/general/SimulationSettings.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { Typography, Alert, Table, Tooltip, Button, Modal, Form as AntForm, InputNumber, Select } from 'antd';
import { InfoCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as yup from 'yup';

// Import our form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField
} from '../../components/forms';
import FormButtons from '../../components/forms/FormButtons';
import UnsavedChangesIndicator from '../forms/UnsavedChangesIndicator';

const { Title } = Typography;

// Define validation schema
const simulationSchema = yup.object({
  iterations: yup
    .number()
    .required('Number of iterations is required')
    .min(100, 'Minimum 100 iterations')
    .max(100000, 'Maximum 100,000 iterations')
    .integer('Must be an integer'),
  
  seed: yup
    .number()
    .required('Random seed is required')
    .integer('Must be an integer'),
  
  // Note: We'll manually handle percentiles validation since we're managing it with arrayOperations
}).required();

const SimulationSettings = () => {
  // Use scenario context for array operations
  const { arrayOperations } = useScenario();
  
  // Local state for percentile editing
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPercentile, setEditingPercentile] = useState(null);
  const [percentileForm] = AntForm.useForm();
  
  // Use our custom form hook with modulePath for simulation settings
  const {
    control,
    watch,
    formState: { errors },
    onSubmitForm,
    isDirty,
    reset,
    scenarioData
  } = useScenarioForm({
    validationSchema: simulationSchema,
    modulePath: ['settings', 'simulation'],
    showSuccessMessage: true,
    successMessage: 'Simulation settings saved successfully'
  });
  
  // Watch percentiles - wrap this in useMemo to fix the ESLint warning
  const percentiles = useMemo(() => watch('percentiles') || [], [watch]);
  
  // Define description options for drop-down
  const descriptionOptions = useMemo(() => [
    { value: 'primary', label: 'Primary (e.g., P50)' },
    { value: 'upper_bound', label: 'Upper Bound (e.g., P75)' },
    { value: 'lower_bound', label: 'Lower Bound (e.g., P25)' },
    { value: 'extreme_upper', label: 'Extreme Upper (e.g., P90)' },
    { value: 'extreme_lower', label: 'Extreme Lower (e.g., P10)' }
  ], []);

  // Handle percentile edit - use useCallback to make it stable for useMemo dependencies
  const handleEditPercentile = useCallback((percentile) => {
    setEditingPercentile(percentile);
    percentileForm.setFieldsValue({
      value: percentile.value,
      description: percentile.description
    });
    setEditModalVisible(true);
  }, [percentileForm]);
  
  // Handle percentile save
  const handleSavePercentile = useCallback(() => {
    percentileForm.validateFields().then(values => {
      if (editingPercentile) {
        // Update existing percentile
        arrayOperations(
          ['settings', 'simulation', 'percentiles'],
          'update',
          values,
          editingPercentile.id
        );
      } else {
        // Add new percentile
        arrayOperations(
          ['settings', 'simulation', 'percentiles'],
          'add',
          {
            ...values,
            id: `percentile_${Date.now()}`
          }
        );
      }
      
      setEditModalVisible(false);
      setEditingPercentile(null);
      percentileForm.resetFields();
    });
  }, [arrayOperations, editingPercentile, percentileForm]);
  
  // Handle percentile delete - use useCallback to make it stable for useMemo dependencies
  const handleDeletePercentile = useCallback((id) => {
    // Don't allow deleting if it's the only primary percentile
    const isPrimary = percentiles.find(p => p.id === id)?.description === 'primary';
    const primaryCount = percentiles.filter(p => p.description === 'primary').length;
    
    if (isPrimary && primaryCount <= 1) {
      Modal.error({
        title: 'Cannot Delete Primary Percentile',
        content: 'You must have exactly one primary percentile. Edit it instead of deleting.'
      });
      return;
    }
    
    arrayOperations(
      ['settings', 'simulation', 'percentiles'],
      'remove',
      null,
      id
    );
  }, [arrayOperations, percentiles]);
  
  // Define columns for percentiles table - include the necessary dependencies
  const percentileColumns = useMemo(() => [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => {
        const option = descriptionOptions.find(opt => opt.value === text);
        return option ? option.label : text;
      }
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `P${value}`
    },
    {
      title: 'Percentile Label',
      key: 'label',
      render: (_, record) => `P${record.value}`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <span>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditPercentile(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeletePercentile(record.id)}
          />
        </span>
      )
    }
  ], [descriptionOptions, handleEditPercentile, handleDeletePercentile]);
  
  // Validate percentiles
  const percentileErrors = useMemo(() => {
    if (!percentiles || percentiles.length === 0) {
      return ["At least one percentile is required"];
    }
    
    const primaryCount = percentiles.filter(p => p.description === 'primary').length;
    if (primaryCount !== 1) {
      return ["Must have exactly one primary percentile"];
    }
    
    // Check logical order
    if (percentiles.length >= 5) {
      const byDesc = percentiles.reduce((acc, p) => {
        acc[p.description] = p.value;
        return acc;
      }, {});
      
      if ((byDesc.extreme_lower && byDesc.lower_bound && byDesc.extreme_lower >= byDesc.lower_bound) ||
          (byDesc.lower_bound && byDesc.primary && byDesc.lower_bound >= byDesc.primary) ||
          (byDesc.primary && byDesc.upper_bound && byDesc.primary >= byDesc.upper_bound) ||
          (byDesc.upper_bound && byDesc.extreme_upper && byDesc.upper_bound >= byDesc.extreme_upper)) {
        return ["Percentiles must follow logical order (extreme_lower < lower_bound < primary < upper_bound < extreme_upper)"];
      }
    }
    
    return [];
  }, [percentiles]);
  
  // Handle adding a new percentile - use useCallback for event handlers
  const handleAddPercentile = useCallback(() => {
    setEditingPercentile(null);
    percentileForm.resetFields();
    setEditModalVisible(true);
  }, [percentileForm]);
  
  // Handle modal cancel - use useCallback for event handlers
  const handleModalCancel = useCallback(() => {
    setEditModalVisible(false);
    setEditingPercentile(null);
  }, []);
  
  // Check if we have an active scenario
  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Simulation Settings</Title>
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
      <Title level={2}>
        Simulation Settings
        <UnsavedChangesIndicator isDirty={isDirty} onSave={onSubmitForm} />
      </Title>
      <p>Configure simulation parameters and probability levels for visualization.</p>

      {/* Custom Form component without built-in buttons */}
      <Form 
        onSubmit={null} 
        submitButtons={false}
      >
        <FormSection title="Monte Carlo Simulation Settings" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="iterations"
                label={
                  <span>
                    Number of Monte Carlo Iterations
                    <Tooltip title="Higher values provide more statistical accuracy at the cost of longer computation time">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                control={control}
                error={errors.iterations?.message}
                min={100}
                max={100000}
                step={1000}
                style={{ width: 200 }}
              />
            </FormCol>
          </FormRow>

          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="seed"
                label={
                  <span>
                    Random Seed
                    <Tooltip title="Using the same seed ensures reproducible results">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                control={control}
                error={errors.seed?.message}
                min={1}
                step={1}
                style={{ width: 120 }}
              />
            </FormCol>
          </FormRow>
        </FormSection>

        <FormSection 
          title="Percentiles for Visualization" 
          style={{ marginBottom: 24 }}
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddPercentile}
            >
              Add Percentile
            </Button>
          }
        >
          <p>Configure which percentiles (P-values) to display in charts and results.</p>
          
          {/* Display error message if there are percentile validation errors */}
          {percentileErrors.length > 0 && (
            <Alert 
              message="Percentile Configuration Error" 
              description={percentileErrors.join(", ")}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {/* Percentiles table */}
          {Array.isArray(percentiles) && percentiles.length > 0 ? (
            <Table 
              dataSource={percentiles}
              columns={percentileColumns}
              pagination={false}
              rowKey="id"
              size="small"
              style={{ marginBottom: 16 }}
            />
          ) : (
            <Alert
              message="No Percentiles Defined" 
              description="Add at least one percentile to configure visualization settings."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Alert
            message="Percentile Definitions"
            description={
              <ul>
                <li><strong>Primary:</strong> The main P-value for charts (typically P50)</li>
                <li><strong>Upper/Lower Bound:</strong> Middle confidence interval (typically P75/P25)</li>
                <li><strong>Extreme Upper/Lower:</strong> Wider confidence interval (typically P90/P10)</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </FormSection>
          
        {/* Form Actions */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <FormButtons
            onSubmit={onSubmitForm}
            onReset={() => reset()}
            isDirty={isDirty}
          />
        </div>
      </Form>
      
      {/* Percentile Edit Modal */}
      <Modal
        title={editingPercentile ? "Edit Percentile" : "Add Percentile"}
        open={editModalVisible}
        onOk={handleSavePercentile}
        onCancel={handleModalCancel}
        okText={editingPercentile ? "Update" : "Add"}
      >
        <AntForm form={percentileForm} layout="vertical">
          <AntForm.Item
            name="value"
            label="Percentile Value"
            rules={[
              { required: true, message: 'Please enter a percentile value' },
              { type: 'number', min: 1, max: 99, message: 'Value must be between 1 and 99' }
            ]}
          >
            <InputNumber 
              min={1} 
              max={99} 
              formatter={value => `P${value}`}
              parser={value => value.replace('P', '')}
              style={{ width: '100%' }}
            />
          </AntForm.Item>
          
          <AntForm.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please select a description' }]}
          >
            <Select options={descriptionOptions} />
          </AntForm.Item>
        </AntForm>
      </Modal>
    </div>
  );
};

export default SimulationSettings;