// src/components/modules/CostModule.jsx
import React, { useEffect, useState } from 'react';
import { Typography, Card, Divider, Tabs, Button, Alert, Space } from 'antd';
import { InfoCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, InputNumber, Select } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

// Define validation schema
const costSchema = yup.object({
  annualBaseOM: yup
    .number()
    .required('Annual base O&M cost is required')
    .min(0, 'Must be positive'),
  
  escalationRate: yup
    .number()
    .required('Escalation rate is required')
    .min(0, 'Must be positive')
    .max(10, 'Must be less than 10%'),
  
  escalationDistribution: yup
    .string()
    .required('Escalation distribution is required')
    .oneOf(['Normal', 'Lognormal', 'Triangular', 'Uniform'], 'Invalid distribution type'),
  
  oemTerm: yup
    .number()
    .required('OEM term is required')
    .min(0, 'Must be positive')
    .integer('Must be an integer'),
  
  failureEventProbability: yup
    .number()
    .required('Failure event probability is required')
    .min(0, 'Must be positive')
    .max(100, 'Must be less than 100%'),
  
  failureEventCost: yup
    .number()
    .required('Failure event cost is required')
    .min(0, 'Must be positive')
}).required();

const CostModule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('routine');
  const [oemContracts, setOEMContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  
  // Use our enhanced context
  const { 
    getValueByPath,
    updateModuleSettings
  } = useScenario();
  
  // Get cost module data from context
  const costModuleData = getValueByPath(['settings', 'modules', 'cost'], {});
  
  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    formState: { errors, dirtyFields },
    reset
  } = useForm({
    resolver: yupResolver(costSchema),
    defaultValues: {
      annualBaseOM: costModuleData.annualBaseOM || 5000000,
      escalationRate: costModuleData.escalationRate || 2,
      escalationDistribution: costModuleData.escalationDistribution || 'Normal',
      oemTerm: costModuleData.oemTerm || 5,
      failureEventProbability: costModuleData.failureEventProbability || 5,
      failureEventCost: costModuleData.failureEventCost || 200000
    }
  });
  
  // Reset form when costModuleData changes
  useEffect(() => {
    reset({
      annualBaseOM: costModuleData.annualBaseOM || 5000000,
      escalationRate: costModuleData.escalationRate || 2,
      escalationDistribution: costModuleData.escalationDistribution || 'Normal',
      oemTerm: costModuleData.oemTerm || 5,
      failureEventProbability: costModuleData.failureEventProbability || 5,
      failureEventCost: costModuleData.failureEventCost || 200000
    });
  }, [costModuleData, reset]);
  
  // Form submission handler
  const onSubmit = (data) => {
    // Only include fields that have changed
    const updates = {};
    Object.keys(dirtyFields).forEach(key => {
      updates[key] = data[key];
    });
    
    if (Object.keys(updates).length > 0) {
      updateModuleSettings('cost', updates);
    }
  };
  
  // Navigate to OEM Contracts page
  const goToOEMContracts = () => {
    navigate('/config/scenario/oemcontracts');
  };
  
  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    
    // Save any changes when switching tabs
    handleSubmit(onSubmit)();
  };
  
  // Define tabs items
  const tabItems = [
    {
      key: 'routine',
      label: 'Routine O&M',
      children: (
        <Card title="Base O&M Costs">
          <Form.Item
            label="Annual Base O&M Cost (USD/year)"
            validateStatus={errors.annualBaseOM ? 'error' : ''}
            help={errors.annualBaseOM?.message}
          >
            <Controller
              name="annualBaseOM"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  step={100000} 
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
          
          <Form.Item
            label="O&M Cost Escalation Rate (%/year)"
            validateStatus={errors.escalationRate ? 'error' : ''}
            help={errors.escalationRate?.message}
          >
            <Controller
              name="escalationRate"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  max={10} 
                  step={0.1} 
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
          
          <Form.Item
            label="Escalation Distribution"
            validateStatus={errors.escalationDistribution ? 'error' : ''}
            help={errors.escalationDistribution?.message}
            tooltip="Distribution type for the escalation rate uncertainty"
          >
            <Controller
              name="escalationDistribution"
              control={control}
              render={({ field }) => (
                <Select {...field} style={{ width: '100%' }}>
                  <Option value="Normal">Normal</Option>
                  <Option value="Lognormal">Lognormal</Option>
                  <Option value="Triangular">Triangular</Option>
                  <Option value="Uniform">Uniform</Option>
                </Select>
              )}
            />
          </Form.Item>
        </Card>
      )
    },
    {
      key: 'oem',
      label: 'OEM Contract',
      children: (
        <Card 
          title={
            <span>
              <ToolOutlined style={{ marginRight: 8 }} />
              OEM Contract Settings
            </span>
          }
          extra={
            <Button type="primary" onClick={goToOEMContracts}>
              Manage OEM Contracts
            </Button>
          }
        >
          <p>Select an OEM contract to use for this scenario. OEM contracts define scope and cost during the warranty period.</p>
          
          <Form.Item
            label="OEM Term (Years)"
            validateStatus={errors.oemTerm ? 'error' : ''}
            help={errors.oemTerm?.message}
          >
            <Controller
              name="oemTerm"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  max={30}
                  step={1}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
          
          <Divider dashed />
          
          <p style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.45)' }}>
            To create or edit OEM contracts, click the "Manage OEM Contracts" button above.
          </p>
        </Card>
      )
    },
    {
      key: 'failures',
      label: 'Failures',
      children: (
        <Card title="Failure Events">
          <Form.Item
            label="Failure Event Probability (%/year)"
            validateStatus={errors.failureEventProbability ? 'error' : ''}
            help={errors.failureEventProbability?.message}
            tooltip="Annual probability of a failure event occurring"
          >
            <Controller
              name="failureEventProbability"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  max={100} 
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
          
          <Form.Item
            label="Failure Event Cost (USD per event)"
            validateStatus={errors.failureEventCost ? 'error' : ''}
            help={errors.failureEventCost?.message}
            tooltip="Average cost of each failure event"
          >
            <Controller
              name="failureEventCost"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  step={10000} 
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
        </Card>
      )
    },
    {
      key: 'major',
      label: 'Major Repairs',
      children: (
        <Card title="Major Repairs / Overhauls">
          <p>Configure deterministic or probabilistic major cost events (e.g., blade or gearbox replacements).</p>
          
          {/* This would be implemented with a dynamic form for adding major repair events */}
          <p>This feature will be implemented in a future version.</p>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Cost Module Configuration</Title>
      <p>Configure the cost parameters for the wind farm simulation.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange} 
          items={tabItems} 
        />
        
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => reset()}>Reset</Button>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Space>
        </div>
      </form>
    </div>
  );
};

export default CostModule;