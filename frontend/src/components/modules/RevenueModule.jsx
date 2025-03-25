// src/components/modules/RevenueModule.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Card, Tabs, Radio, Space, Button } from 'antd';
import { PercentageOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, InputNumber, Select } from 'antd';

const { Title } = Typography;
const { Option } = Select;

// Define validation schema
const revenueSchema = yup.object({
  // Energy Production
  energyProduction: yup.object({
    distribution: yup
      .string()
      .required('Distribution type is required')
      .oneOf(['Fixed', 'Normal', 'Triangular', 'Uniform'], 'Invalid distribution type'),
    
    mean: yup
      .number()
      .required('Mean energy production is required')
      .min(0, 'Must be positive'),
    
    std: yup
      .number()
      .when('distribution', {
        is: 'Normal',
        then: schema => schema.required('Standard deviation is required').min(0, 'Must be positive')
      }),
    
    min: yup
      .number()
      .when('distribution', {
        is: (dist) => ['Triangular', 'Uniform'].includes(dist),
        then: schema => schema.required('Minimum value is required').min(0, 'Must be positive')
      }),
    
    max: yup
      .number()
      .when('distribution', {
        is: (dist) => ['Triangular', 'Uniform'].includes(dist),
        then: schema => schema.required('Maximum value is required').min(0, 'Must be positive')
      })
  }),
  
  // Electricity Price
  electricityPrice: yup.object({
    type: yup
      .string()
      .required('Price type is required')
      .oneOf(['fixed', 'variable'], 'Invalid price type'),
    
    value: yup
      .number()
      .when('type', {
        is: 'fixed',
        then: schema => schema.required('Price value is required').min(0, 'Must be positive')
      }),
    
    distribution: yup
      .string()
      .when('type', {
        is: 'variable',
        then: schema => schema.required('Distribution type is required')
          .oneOf(['Normal', 'Lognormal', 'Triangular', 'Uniform'], 'Invalid distribution type')
      })
  }),
  
  // Revenue Degradation
  revenueDegradationRate: yup
    .number()
    .required('Revenue degradation rate is required')
    .min(0, 'Must be positive')
    .max(10, 'Must be less than 10%'),
  
  // Downtime
  downtimePerEvent: yup.object({
    distribution: yup
      .string()
      .required('Downtime distribution is required')
      .oneOf(['Weibull', 'Lognormal', 'Exponential'], 'Invalid distribution type'),
    
    scale: yup
      .number()
      .required('Scale parameter is required')
      .min(0, 'Must be positive'),
    
    shape: yup
      .number()
      .when('distribution', {
        is: (dist) => ['Weibull', 'Lognormal'].includes(dist),
        then: schema => schema.required('Shape parameter is required').min(0, 'Must be positive')
      })
  }),
  
  // Wind Variability
  windVariabilityMethod: yup
    .string()
    .required('Wind variability method is required')
    .oneOf(['Default', 'Kaimal'], 'Invalid wind variability method'),
  
  turbulenceIntensity: yup
    .number()
    .when('windVariabilityMethod', {
      is: 'Kaimal',
      then: schema => schema.required('Turbulence intensity is required').min(0, 'Must be positive').max(30, 'Must be less than 30%')
    }),
  
  surfaceRoughness: yup
    .number()
    .when('windVariabilityMethod', {
      is: 'Kaimal',
      then: schema => schema.required('Surface roughness is required').min(0.001, 'Must be positive').max(1, 'Must be less than 1')
    }),
  
  kaimalScale: yup
    .number()
    .when('windVariabilityMethod', {
      is: 'Kaimal',
      then: schema => schema.required('Kaimal scale is required').min(1, 'Must be at least 1').max(20, 'Must be less than 20')
    })
}).required();

const RevenueModule = () => {
  const [activeTab, setActiveTab] = useState('production');
  
  // Use our enhanced context
  const { 
    getValueByPath,
    updateModuleSettings
  } = useScenario();
  
  // Get revenue module data from context
  const revenueData = getValueByPath(['settings', 'modules', 'revenue'], {});
  
  // Initialize state for conditional rendering
  const [priceType, setPriceType] = useState(revenueData.electricityPrice?.type || 'fixed');
  const [energyDistribution, setEnergyDistribution] = useState(revenueData.energyProduction?.distribution || 'Normal');
  const [downtimeDistribution, setDowntimeDistribution] = useState(revenueData.downtimePerEvent?.distribution || 'Weibull');
  const [windMethod, setWindMethod] = useState(revenueData.windVariabilityMethod || 'Default');

  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    watch,
    formState: { errors, isDirty },
    reset
  } = useForm({
    resolver: yupResolver(revenueSchema),
    defaultValues: {
      energyProduction: {
        distribution: revenueData.energyProduction?.distribution || 'Normal',
        mean: revenueData.energyProduction?.mean || 1000,
        std: revenueData.energyProduction?.std || 100,
        min: revenueData.energyProduction?.min,
        max: revenueData.energyProduction?.max
      },
      electricityPrice: {
        type: revenueData.electricityPrice?.type || 'fixed',
        value: revenueData.electricityPrice?.value || 50,
        distribution: revenueData.electricityPrice?.distribution || 'Normal'
      },
      revenueDegradationRate: revenueData.revenueDegradationRate || 0.5,
      downtimePerEvent: {
        distribution: revenueData.downtimePerEvent?.distribution || 'Weibull',
        scale: revenueData.downtimePerEvent?.scale || 24,
        shape: revenueData.downtimePerEvent?.shape || 1.5
      },
      windVariabilityMethod: revenueData.windVariabilityMethod || 'Default',
      turbulenceIntensity: revenueData.turbulenceIntensity || 10,
      surfaceRoughness: revenueData.surfaceRoughness || 0.03,
      kaimalScale: revenueData.kaimalScale || 8.1
    }
  });
  
  // Watch values for conditional rendering
  const watchPriceType = watch('electricityPrice.type');
  const watchEnergyDistribution = watch('energyProduction.distribution');
  const watchDowntimeDistribution = watch('downtimePerEvent.distribution');
  const watchWindMethod = watch('windVariabilityMethod');
  
  // Update state values when form values change
  useEffect(() => {
    setPriceType(watchPriceType);
    setEnergyDistribution(watchEnergyDistribution);
    setDowntimeDistribution(watchDowntimeDistribution);
    setWindMethod(watchWindMethod);
  }, [watchPriceType, watchEnergyDistribution, watchDowntimeDistribution, watchWindMethod]);
  
  // Reset form when revenueData changes
  useEffect(() => {
    reset({
      energyProduction: {
        distribution: revenueData.energyProduction?.distribution || 'Normal',
        mean: revenueData.energyProduction?.mean || 1000,
        std: revenueData.energyProduction?.std || 100,
        min: revenueData.energyProduction?.min,
        max: revenueData.energyProduction?.max
      },
      electricityPrice: {
        type: revenueData.electricityPrice?.type || 'fixed',
        value: revenueData.electricityPrice?.value || 50,
        distribution: revenueData.electricityPrice?.distribution || 'Normal'
      },
      revenueDegradationRate: revenueData.revenueDegradationRate || 0.5,
      downtimePerEvent: {
        distribution: revenueData.downtimePerEvent?.distribution || 'Weibull',
        scale: revenueData.downtimePerEvent?.scale || 24,
        shape: revenueData.downtimePerEvent?.shape || 1.5
      },
      windVariabilityMethod: revenueData.windVariabilityMethod || 'Default',
      turbulenceIntensity: revenueData.turbulenceIntensity || 10,
      surfaceRoughness: revenueData.surfaceRoughness || 0.03,
      kaimalScale: revenueData.kaimalScale || 8.1
    });
  }, [revenueData, reset]);
  
  // Form submission handler
  const onSubmit = (data) => {
    // Update revenue module settings
    updateModuleSettings('revenue', data);
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
      key: 'production',
      label: 'Energy Production',
      children: (
        <Card title="Energy Production Parameters">
          <Form.Item
            label="Energy Production Distribution"
            validateStatus={errors.energyProduction?.distribution ? 'error' : ''}
            help={errors.energyProduction?.distribution?.message}
          >
            <Controller
              name="energyProduction.distribution"
              control={control}
              render={({ field }) => (
                <Select {...field} style={{ width: '100%' }}>
                  <Option value="Fixed">Fixed</Option>
                  <Option value="Normal">Normal</Option>
                  <Option value="Triangular">Triangular</Option>
                  <Option value="Uniform">Uniform</Option>
                </Select>
              )}
            />
          </Form.Item>
          
          <Form.Item
            label="Mean Energy Production (MWh/year)"
            validateStatus={errors.energyProduction?.mean ? 'error' : ''}
            help={errors.energyProduction?.mean?.message}
          >
            <Controller
              name="energyProduction.mean"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  step={100} 
                  style={{ width: '100%' }} 
                />
              )}
            />
          </Form.Item>
          
          {energyDistribution === 'Normal' && (
            <Form.Item
              label="Standard Deviation (MWh/year)"
              validateStatus={errors.energyProduction?.std ? 'error' : ''}
              help={errors.energyProduction?.std?.message}
            >
              <Controller
                name="energyProduction.std"
                control={control}
                render={({ field }) => (
                  <InputNumber 
                    {...field}
                    min={0} 
                    step={10} 
                    style={{ width: '100%' }} 
                  />
                )}
              />
            </Form.Item>
          )}
          
          {['Triangular', 'Uniform'].includes(energyDistribution) && (
            <>
              <Form.Item
                label="Minimum (MWh/year)"
                validateStatus={errors.energyProduction?.min ? 'error' : ''}
                help={errors.energyProduction?.min?.message}
              >
                <Controller
                  name="energyProduction.min"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={0} 
                      step={100} 
                      style={{ width: '100%' }} 
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Maximum (MWh/year)"
                validateStatus={errors.energyProduction?.max ? 'error' : ''}
                help={errors.energyProduction?.max?.message}
              >
                <Controller
                  name="energyProduction.max"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={0} 
                      step={100} 
                      style={{ width: '100%' }} 
                    />
                  )}
                />
              </Form.Item>
            </>
          )}
          
          <Form.Item
            label="Revenue Degradation Rate (%/year)"
            validateStatus={errors.revenueDegradationRate ? 'error' : ''}
            help={errors.revenueDegradationRate?.message}
            tooltip="Annual rate at which revenue decreases due to aging equipment"
          >
            <Controller
              name="revenueDegradationRate"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  prefix={<PercentageOutlined />}
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
        </Card>
      )
    },
    {
      key: 'price',
      label: 'Electricity Price',
      children: (
        <Card title="Electricity Price Parameters">
          <Form.Item
            label="Price Type"
            validateStatus={errors.electricityPrice?.type ? 'error' : ''}
            help={errors.electricityPrice?.type?.message}
          >
            <Controller
              name="electricityPrice.type"
              control={control}
              render={({ field }) => (
                <Radio.Group {...field}>
                  <Radio value="fixed">Fixed (PPA)</Radio>
                  <Radio value="variable">Variable (Market)</Radio>
                </Radio.Group>
              )}
            />
          </Form.Item>
          
          {priceType === 'fixed' ? (
            <Form.Item
              label="Electricity Price (USD/MWh)"
              validateStatus={errors.electricityPrice?.value ? 'error' : ''}
              help={errors.electricityPrice?.value?.message}
            >
              <Controller
                name="electricityPrice.value"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    min={0}
                    step={1}
                    formatter={value => `$ ${value}`}
                    parser={value => value.replace('$ ', '')}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                label="Price Distribution"
                validateStatus={errors.electricityPrice?.distribution ? 'error' : ''}
                help={errors.electricityPrice?.distribution?.message}
              >
                <Controller
                  name="electricityPrice.distribution"
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
              
              <p>Additional distribution parameters will be available in a future version.</p>
            </>
          )}
        </Card>
      )
    },
    {
      key: 'downtime',
      label: 'Downtime',
      children: (
        <Card title="Downtime Parameters">
          <Form.Item
            label="Downtime Distribution"
            validateStatus={errors.downtimePerEvent?.distribution ? 'error' : ''}
            help={errors.downtimePerEvent?.distribution?.message}
          >
            <Controller
              name="downtimePerEvent.distribution"
              control={control}
              render={({ field }) => (
                <Select {...field} style={{ width: '100%' }}>
                  <Option value="Weibull">Weibull</Option>
                  <Option value="Lognormal">Lognormal</Option>
                  <Option value="Exponential">Exponential</Option>
                </Select>
              )}
            />
          </Form.Item>
          
          <Form.Item
            label="Scale Parameter (hours)"
            validateStatus={errors.downtimePerEvent?.scale ? 'error' : ''}
            help={errors.downtimePerEvent?.scale?.message}
            tooltip="For Weibull: Scale parameter; For Lognormal: Median value"
          >
            <Controller
              name="downtimePerEvent.scale"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  step={1} 
                  style={{ width: '100%' }} 
                />
              )}
            />
          </Form.Item>
          
          {['Weibull', 'Lognormal'].includes(downtimeDistribution) && (
            <Form.Item
              label="Shape Parameter"
              validateStatus={errors.downtimePerEvent?.shape ? 'error' : ''}
              help={errors.downtimePerEvent?.shape?.message}
              tooltip="For Weibull: Shape parameter; For Lognormal: Sigma parameter"
            >
              <Controller
                name="downtimePerEvent.shape"
                control={control}
                render={({ field }) => (
                  <InputNumber 
                    {...field}
                    min={0} 
                    step={0.1} 
                    style={{ width: '100%' }} 
                  />
                )}
              />
            </Form.Item>
          )}
        </Card>
      )
    },
    {
      key: 'wind',
      label: 'Wind Variability',
      children: (
        <Card title="Wind Variability Simulation Method">
          <Form.Item
            label="Method"
            validateStatus={errors.windVariabilityMethod ? 'error' : ''}
            help={errors.windVariabilityMethod?.message}
          >
            <Controller
              name="windVariabilityMethod"
              control={control}
              render={({ field }) => (
                <Radio.Group {...field}>
                  <Radio value="Default">Default</Radio>
                  <Radio value="Kaimal">Industry Standard (Kaimal/IEC 61400-1)</Radio>
                </Radio.Group>
              )}
            />
          </Form.Item>
          
          {windMethod === 'Kaimal' && (
            <>
              <Form.Item
                label="Turbulence Intensity (%)"
                validateStatus={errors.turbulenceIntensity ? 'error' : ''}
                help={errors.turbulenceIntensity?.message}
                tooltip="Percentage of mean wind speed"
              >
                <Controller
                  name="turbulenceIntensity"
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
              
              <Form.Item
                label="Surface Roughness Length (m)"
                validateStatus={errors.surfaceRoughness ? 'error' : ''}
                help={errors.surfaceRoughness?.message}
                tooltip="Characteristic of the terrain"
              >
                <Controller
                  name="surfaceRoughness"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={0.001} 
                      max={1} 
                      step={0.01} 
                      style={{ width: '100%' }} 
                    />
                  )}
                />
              </Form.Item>
              
              <Form.Item
                label="Kaimal Scale Parameter (m)"
                validateStatus={errors.kaimalScale ? 'error' : ''}
                help={errors.kaimalScale?.message}
              >
                <Controller
                  name="kaimalScale"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={1} 
                      max={20} 
                      step={0.1} 
                      style={{ width: '100%' }} 
                    />
                  )}
                />
              </Form.Item>
            </>
          )}
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Revenue Module Configuration</Title>
      <p>Configure the revenue parameters for the wind farm simulation.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange} 
          items={tabItems} 
        />
        
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => reset()}>Reset</Button>
            <Button type="primary" htmlType="submit" disabled={!isDirty}>
              Save Changes
            </Button>
          </Space>
        </div>
      </form>
    </div>
  );
};

export default RevenueModule;