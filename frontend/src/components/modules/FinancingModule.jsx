// src/components/modules/FinancingModule.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Card, Divider, Row, Col, Radio, Alert, Space, Button } from 'antd';
import { DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, InputNumber } from 'antd';

const { Title } = Typography;

// Define validation schema
const financingSchema = yup.object({
  capex: yup
    .number()
    .required('CAPEX is required')
    .min(0, 'Must be positive'),
  
  devex: yup
    .number()
    .required('DEVEX is required')
    .min(0, 'Must be positive'),
  
  model: yup
    .string()
    .required('Financing model is required')
    .oneOf(['Balance-Sheet', 'Project-Finance'], 'Invalid financing model'),
  
  loanDuration: yup
    .number()
    .required('Loan duration is required')
    .min(1, 'Must be at least 1 year')
    .max(30, 'Must be less than 30 years')
    .integer('Must be an integer'),
  
  debtToEquityRatio: yup
    .number()
    .when('model', {
      is: 'Balance-Sheet',
      then: schema => schema.required('Debt-to-Equity ratio is required').min(0, 'Must be positive')
    }),
  
  debtToCapexRatio: yup
    .number()
    .when('model', {
      is: 'Project-Finance',
      then: schema => schema.required('Debt-to-CAPEX ratio is required').min(0, 'Must be positive').max(1, 'Must be less than or equal to 1')
    }),
  
  loanInterestRateBS: yup
    .number()
    .when('model', {
      is: 'Balance-Sheet',
      then: schema => schema.required('Loan interest rate is required').min(0, 'Must be positive').max(20, 'Must be less than 20%')
    }),
  
  loanInterestRatePF: yup
    .number()
    .when('model', {
      is: 'Project-Finance',
      then: schema => schema.required('Loan interest rate is required').min(0, 'Must be positive').max(20, 'Must be less than 20%')
    }),
  
  minimumDSCR: yup
    .number()
    .required('Minimum DSCR is required')
    .min(1, 'Must be at least 1')
}).required();

const FinancingModule = () => {
  // Use our enhanced context
  const { 
    getValueByPath,
    updateModuleSettings
  } = useScenario();
  
  // Get financing module data from context
  const financingData = getValueByPath(['settings', 'modules', 'financing'], {});
  
  // Track the financing model type for conditional rendering
  const [financingModel, setFinancingModel] = useState(financingData.model || 'Balance-Sheet');

  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    watch,
    formState: { errors, isDirty },
    reset
  } = useForm({
    resolver: yupResolver(financingSchema),
    defaultValues: {
      capex: financingData.capex || 50000000,
      devex: financingData.devex || 10000000,
      model: financingData.model || 'Balance-Sheet',
      loanDuration: financingData.loanDuration || 15,
      debtToEquityRatio: financingData.debtToEquityRatio || 1.5,
      debtToCapexRatio: financingData.debtToCapexRatio || 0.7,
      loanInterestRateBS: financingData.loanInterestRateBS || 5,
      loanInterestRatePF: financingData.loanInterestRatePF || 6,
      minimumDSCR: financingData.minimumDSCR || 1.3
    },
    mode: 'onChange'
  });
  
  // Watch the financing model to update the state
  const watchedModel = watch('model');
  
  // Update financing model when it changes
  useEffect(() => {
    setFinancingModel(watchedModel);
  }, [watchedModel]);
  
  // Reset form when financingData changes
  useEffect(() => {
    reset({
      capex: financingData.capex || 50000000,
      devex: financingData.devex || 10000000,
      model: financingData.model || 'Balance-Sheet',
      loanDuration: financingData.loanDuration || 15,
      debtToEquityRatio: financingData.debtToEquityRatio || 1.5,
      debtToCapexRatio: financingData.debtToCapexRatio || 0.7,
      loanInterestRateBS: financingData.loanInterestRateBS || 5,
      loanInterestRatePF: financingData.loanInterestRatePF || 6,
      minimumDSCR: financingData.minimumDSCR || 1.3
    });
  }, [financingData, reset]);
  
  // Form submission handler
  const onSubmit = (data) => {
    // Update financing module settings
    updateModuleSettings('financing', data);
  };

  return (
    <div>
      <Title level={2}>Financing Module Configuration</Title>
      <p>Configure the financial parameters and investment structure for the wind farm project.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Investment Section */}
        <Card title="Investment Parameters" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="CAPEX Investment (USD)"
                validateStatus={errors.capex ? 'error' : ''}
                help={errors.capex?.message}
                tooltip="Upfront capital expenditure required for plant construction"
              >
                <Controller
                  name="capex"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      prefix={<DollarOutlined />}
                      min={0}
                      step={1000000}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="DEVEX Investment (USD)"
                validateStatus={errors.devex ? 'error' : ''}
                help={errors.devex?.message}
                tooltip="Development expenditure incurred prior to construction"
              >
                <Controller
                  name="devex"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      prefix={<DollarOutlined />}
                      min={0}
                      step={1000000}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Loan Parameters */}
        <Card title="Loan Parameters" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Loan Duration / Loan Tenor (Years)"
            validateStatus={errors.loanDuration ? 'error' : ''}
            help={errors.loanDuration?.message}
            tooltip="Duration over which the loan is repaid"
          >
            <Controller
              name="loanDuration"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={1} 
                  max={30}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
        </Card>

        {/* Financing Model Section */}
        <Card title="Financing Model" style={{ marginBottom: 24 }}>
          <Form.Item
            validateStatus={errors.model ? 'error' : ''}
            help={errors.model?.message}
          >
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <Radio.Group {...field} buttonStyle="solid">
                  <Radio.Button value="Balance-Sheet">Balance-Sheet</Radio.Button>
                  <Radio.Button value="Project-Finance">Project-Finance (Non-Recourse)</Radio.Button>
                </Radio.Group>
              )}
            />
          </Form.Item>

          <Alert
            message={
              financingModel === 'Balance-Sheet' 
                ? "Balance-Sheet Model" 
                : "Project-Finance Model"
            }
            description={
              financingModel === 'Balance-Sheet'
                ? "Financing is typically on the sponsor's balance sheet, with inputs such as Debt-to-Equity Ratio."
                : "Financing is based on project cash flows, using a Debt-to-CAPEX Ratio with stricter DSCR requirements."
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          {financingModel === 'Balance-Sheet' ? (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Debt-to-Equity Ratio"
                  validateStatus={errors.debtToEquityRatio ? 'error' : ''}
                  help={errors.debtToEquityRatio?.message}
                >
                  <Controller
                    name="debtToEquityRatio"
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
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Loan Interest Rate (%)"
                  validateStatus={errors.loanInterestRateBS ? 'error' : ''}
                  help={errors.loanInterestRateBS?.message}
                >
                  <Controller
                    name="loanInterestRateBS"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        prefix={<PercentageOutlined />}
                        min={0}
                        max={20}
                        step={0.25}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Debt-to-CAPEX Ratio"
                  validateStatus={errors.debtToCapexRatio ? 'error' : ''}
                  help={errors.debtToCapexRatio?.message}
                >
                  <Controller
                    name="debtToCapexRatio"
                    control={control}
                    render={({ field }) => (
                      <InputNumber 
                        {...field}
                        min={0} 
                        max={1} 
                        step={0.05} 
                        style={{ width: '100%' }} 
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Loan Interest Rate (%)"
                  validateStatus={errors.loanInterestRatePF ? 'error' : ''}
                  help={errors.loanInterestRatePF?.message}
                >
                  <Controller
                    name="loanInterestRatePF"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        prefix={<PercentageOutlined />}
                        min={0}
                        max={20}
                        step={0.25}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

        {/* DSCR Requirements */}
        <Card title="Debt Service Requirements">
          <Form.Item
            label="Minimum DSCR (Debt Service Coverage Ratio)"
            validateStatus={errors.minimumDSCR ? 'error' : ''}
            help={errors.minimumDSCR?.message}
            tooltip="Minimum acceptable ratio of cash flow to debt service"
          >
            <Controller
              name="minimumDSCR"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={1} 
                  step={0.05} 
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

export default FinancingModule;