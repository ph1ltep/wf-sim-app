// src/components/inputs/RiskInputs.jsx
import React from 'react';
import { Typography, Form, InputNumber, Switch, Card, Divider, Row, Col } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const RiskInputs = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters || !parameters.riskMitigation) {
    return <div>Loading parameters...</div>;
  }

  const riskParams = parameters.riskMitigation;

  const handleValuesChange = (changedValues, allValues) => {
    // Only update if we have actual changed values
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('riskMitigation', allValues);
    }
  };

  return (
    <div>
      <Title level={2}>Risk Mitigation Configuration</Title>
      <p>Configure risk mitigation strategies for the wind farm project.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={riskParams}
        onValuesChange={handleValuesChange}
      >
        <Card title="Insurance Coverage" style={{ marginBottom: 24 }}>
          <Form.Item
            name="insuranceEnabled"
            label="Enable Insurance Coverage"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          {riskParams.insuranceEnabled && (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Insurance Premium (USD/year)"
                  name="insurancePremium"
                  rules={[{ required: true, message: 'Please input insurance premium!' }]}
                >
                  <InputNumber
                    min={0}
                    step={10000}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Insurance Deductible per Event (USD)"
                  name="insuranceDeductible"
                  tooltip="Only costs exceeding the deductible are covered by insurance"
                >
                  <InputNumber
                    min={0}
                    step={5000}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

        <Card title="Reserve Funds">
          <Form.Item
            label="Reserve Funds (USD)"
            name="reserveFunds"
            tooltip="Cash reserves to smooth out adverse cash flow events"
          >
            <InputNumber
              min={0}
              step={100000}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default RiskInputs;