// src/components/modules/RiskModule.jsx
import React, { useEffect } from 'react';
import { Typography, Card, Divider, Row, Col, Space, Button } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, InputNumber, Switch } from 'antd';

const { Title } = Typography;

// Define validation schema
const riskSchema = yup.object({
  insuranceEnabled: yup
    .boolean()
    .required('Insurance enabled selection is required'),
  
  insurancePremium: yup
    .number()
    .when('insuranceEnabled', {
      is: true,
      then: schema => schema.required('Insurance premium is required').min(0, 'Must be positive')
    }),
  
  insuranceDeductible: yup
    .number()
    .when('insuranceEnabled', {
      is: true,
      then: schema => schema.required('Insurance deductible is required').min(0, 'Must be positive')
    }),
  
  reserveFunds: yup
    .number()
    .required('Reserve funds amount is required')
    .min(0, 'Must be positive')
}).required();

const RiskModule = () => {
  // Use our enhanced context
  const { 
    getValueByPath,
    updateModuleSettings
  } = useScenario();
  
  // Get risk module data from context
  const riskData = getValueByPath(['settings', 'modules', 'risk'], {});
  
  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    watch,
    formState: { errors, isDirty },
    reset
  } = useForm({
    resolver: yupResolver(riskSchema),
    defaultValues: {
      insuranceEnabled: riskData.insuranceEnabled || false,
      insurancePremium: riskData.insurancePremium || 50000,
      insuranceDeductible: riskData.insuranceDeductible || 10000,
      reserveFunds: riskData.reserveFunds || 0
    }
  });
  
  // Watch insurance enabled for conditional rendering
  const insuranceEnabled = watch('insuranceEnabled');
  
  // Reset form when riskData changes
  useEffect(() => {
    reset({
      insuranceEnabled: riskData.insuranceEnabled || false,
      insurancePremium: riskData.insurancePremium || 50000,
      insuranceDeductible: riskData.insuranceDeductible || 10000,
      reserveFunds: riskData.reserveFunds || 0
    });
  }, [riskData, reset]);
  
  // Form submission handler
  const onSubmit = (data) => {
    // Update risk module settings
    updateModuleSettings('risk', data);
  };

  return (
    <div>
      <Title level={2}>Risk Mitigation Configuration</Title>
      <p>Configure risk mitigation strategies for the wind farm project.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card title="Insurance Coverage" style={{ marginBottom: 24 }}>
          <Form.Item
            name="insuranceEnabled"
            label="Enable Insurance Coverage"
            validateStatus={errors.insuranceEnabled ? 'error' : ''}
            help={errors.insuranceEnabled?.message}
          >
            <Controller
              name="insuranceEnabled"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <Switch 
                  checked={value} 
                  onChange={onChange}
                  ref={ref}
                />
              )}
            />
          </Form.Item>
          
          {insuranceEnabled && (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Insurance Premium (USD/year)"
                  validateStatus={errors.insurancePremium ? 'error' : ''}
                  help={errors.insurancePremium?.message}
                >
                  <Controller
                    name="insurancePremium"
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
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Insurance Deductible per Event (USD)"
                  validateStatus={errors.insuranceDeductible ? 'error' : ''}
                  help={errors.insuranceDeductible?.message}
                  tooltip="Only costs exceeding the deductible are covered by insurance"
                >
                  <Controller
                    name="insuranceDeductible"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={0}
                        step={5000}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

        <Card title="Reserve Funds">
          <Form.Item
            label="Reserve Funds (USD)"
            validateStatus={errors.reserveFunds ? 'error' : ''}
            help={errors.reserveFunds?.message}
            tooltip="Cash reserves to smooth out adverse cash flow events"
          >
            <Controller
              name="reserveFunds"
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
        </Card>

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

export default RiskModule;