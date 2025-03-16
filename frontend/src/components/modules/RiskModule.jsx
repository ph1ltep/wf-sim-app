// src/components/modules/RiskModule.jsx
import React from 'react';
import { Typography, Form, InputNumber, Switch, Card, Divider, Row, Col } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;

const RiskModule = () => {
  const { settings, updateScenario, scenarioData } = useScenario();
  const [form] = Form.useForm();

  // Only render if settings are loaded
  if (!settings || !scenarioData) {
    return <div>Loading settings...</div>;
  }

  // Get risk parameters, ensuring the object exists
  const riskParams = settings.modules?.risk || {};

  const handleValuesChange = (changedValues, allValues) => {
    // Only update if we have actual changed values
    if (Object.keys(changedValues).length > 0) {
      // Create updated settings
      const updatedSettings = { ...settings };
      
      // Ensure modules and risk objects exist
      if (!updatedSettings.modules) updatedSettings.modules = {};
      if (!updatedSettings.modules.risk) updatedSettings.modules.risk = {};
      
      // Update risk settings
      updatedSettings.modules.risk = {
        ...updatedSettings.modules.risk,
        ...allValues
      };
      
      // Update the scenario with new settings
      updateScenario(scenarioData._id, { settings: updatedSettings });
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

export default RiskModule;