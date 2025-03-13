// src/components/inputs/FinancingInputs.jsx
import React, { useState } from 'react';
import { Typography, Form, InputNumber, Select, Card, Divider, Row, Col, Radio, Alert } from 'antd';
import { DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;
const { Option } = Select;

const FinancingInputs = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();
  const [financingModel, setFinancingModel] = useState('Balance-Sheet');

  // Only render if parameters are loaded
  if (!parameters || !parameters.financing) {
    return <div>Loading parameters...</div>;
  }

  const financingParams = parameters.financing;
  
  // Set initial financing model
  if (financingParams.model && financingParams.model !== financingModel) {
    setFinancingModel(financingParams.model);
  }

  const handleValuesChange = (changedValues, allValues) => {
    // Check if the financing model has changed
    if (changedValues.model && changedValues.model !== financingModel) {
      setFinancingModel(changedValues.model);
    }
    
    // Only update if we have actual changed values
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('financing', allValues);
    }
  };

  return (
    <div>
      <Title level={2}>Financing Module Configuration</Title>
      <p>Configure the financial parameters and investment structure for the wind farm project.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={financingParams}
        onValuesChange={handleValuesChange}
      >
        {/* Investment Section */}
        <Card title="Investment Parameters" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="CAPEX Investment (USD)"
                name="capex"
                rules={[{ required: true, message: 'Please input CAPEX!' }]}
                tooltip="Upfront capital expenditure required for plant construction"
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  min={0}
                  step={1000000}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="DEVEX Investment (USD)"
                name="devex"
                rules={[{ required: true, message: 'Please input DEVEX!' }]}
                tooltip="Development expenditure incurred prior to construction"
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  min={0}
                  step={1000000}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Loan Parameters */}
        <Card title="Loan Parameters" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Loan Duration / Loan Tenor (Years)"
            name="loanDuration"
            rules={[{ required: true, message: 'Please input loan duration!' }]}
            tooltip="Duration over which the loan is repaid"
          >
            <InputNumber min={1} max={30} />
          </Form.Item>
        </Card>

        {/* Financing Model Section */}
        <Card title="Financing Model" style={{ marginBottom: 24 }}>
          <Form.Item 
            name="model"
            rules={[{ required: true, message: 'Please select financing model!' }]}
          >
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="Balance-Sheet">Balance-Sheet</Radio.Button>
              <Radio.Button value="Project-Finance">Project-Finance (Non-Recourse)</Radio.Button>
            </Radio.Group>
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
                  name="debtToEquityRatio"
                  rules={[{ required: true, message: 'Please input Debt-to-Equity ratio!' }]}
                >
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Loan Interest Rate (%)"
                  name="loanInterestRateBS"
                  rules={[{ required: true, message: 'Please input interest rate!' }]}
                >
                  <InputNumber
                    prefix={<PercentageOutlined />}
                    min={0}
                    max={20}
                    step={0.25}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Debt-to-CAPEX Ratio"
                  name="debtToCapexRatio"
                  rules={[{ required: true, message: 'Please input Debt-to-CAPEX ratio!' }]}
                >
                  <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Loan Interest Rate (%)"
                  name="loanInterestRatePF"
                  rules={[{ required: true, message: 'Please input interest rate!' }]}
                >
                  <InputNumber
                    prefix={<PercentageOutlined />}
                    min={0}
                    max={20}
                    step={0.25}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    style={{ width: '100%' }}
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
            name="minimumDSCR"
            tooltip="Minimum acceptable ratio of cash flow to debt service"
          >
            <InputNumber min={1} step={0.05} style={{ width: '100%' }} />
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default FinancingInputs;