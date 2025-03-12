// src/components/inputs/RevenueInputs.jsx
import React from 'react';
import { Typography, Form, InputNumber, Select, Card, Divider, Row, Col, Tabs, Radio } from 'antd';
import { PercentageOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const RevenueInputs = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters || !parameters.revenue) {
    return <div>Loading parameters...</div>;
  }

  const revenueParams = parameters.revenue;

  const handleValuesChange = (changedValues, allValues) => {
    // Only update if we have actual changed values
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('revenue', allValues);
    }
  };

  return (
    <div>
      <Title level={2}>Revenue Module Configuration</Title>
      <p>Configure the revenue parameters for the wind farm simulation.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={revenueParams}
        onValuesChange={handleValuesChange}
      >
        <Tabs defaultActiveKey="production">
          <TabPane tab="Energy Production" key="production">
            <Card title="Energy Production Parameters">
              <Form.Item
                label="Energy Production Distribution"
                name={['energyProduction', 'distribution']}
              >
                <Select>
                  <Option value="Fixed">Fixed</Option>
                  <Option value="Normal">Normal</Option>
                  <Option value="Triangular">Triangular</Option>
                  <Option value="Uniform">Uniform</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                label="Mean Energy Production (MWh/year)"
                name={['energyProduction', 'mean']}
                rules={[{ required: true, message: 'Please input energy production!' }]}
              >
                <InputNumber min={0} step={100} style={{ width: '100%' }} />
              </Form.Item>
              
              {revenueParams.energyProduction?.distribution === 'Normal' && (
                <Form.Item
                  label="Standard Deviation (MWh/year)"
                  name={['energyProduction', 'std']}
                >
                  <InputNumber min={0} step={10} style={{ width: '100%' }} />
                </Form.Item>
              )}
              
              {['Triangular', 'Uniform'].includes(revenueParams.energyProduction?.distribution) && (
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="Minimum (MWh/year)"
                      name={['energyProduction', 'min']}
                    >
                      <InputNumber min={0} step={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Maximum (MWh/year)"
                      name={['energyProduction', 'max']}
                    >
                      <InputNumber min={0} step={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              )}
              
              <Form.Item
                label="Revenue Degradation Rate (%/year)"
                name="revenueDegradationRate"
                tooltip="Annual rate at which revenue decreases due to aging equipment"
              >
                <InputNumber
                  prefix={<PercentageOutlined />}
                  min={0}
                  max={10}
                  step={0.1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Card>
          </TabPane>
          
          <TabPane tab="Electricity Price" key="price">
            <Card title="Electricity Price Parameters">
              <Form.Item
                label="Price Type"
                name={['electricityPrice', 'type']}
              >
                <Radio.Group>
                  <Radio value="fixed">Fixed (PPA)</Radio>
                  <Radio value="variable">Variable (Market)</Radio>
                </Radio.Group>
              </Form.Item>
              
              {revenueParams.electricityPrice?.type === 'fixed' ? (
                <Form.Item
                  label="Electricity Price (USD/MWh)"
                  name={['electricityPrice', 'value']}
                  rules={[{ required: true, message: 'Please input electricity price!' }]}
                >
                  <InputNumber
                    min={0}
                    step={1}
                    formatter={value => `$ ${value}`}
                    parser={value => value.replace('$ ', '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              ) : (
                <>
                  <Form.Item
                    label="Price Distribution"
                    name={['electricityPrice', 'distribution']}
                  >
                    <Select>
                      <Option value="Normal">Normal</Option>
                      <Option value="Lognormal">Lognormal</Option>
                      <Option value="Triangular">Triangular</Option>
                      <Option value="Uniform">Uniform</Option>
                    </Select>
                  </Form.Item>
                  
                  <p>Additional distribution parameters will be available in a future version.</p>
                </>
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="Downtime" key="downtime">
            <Card title="Downtime Parameters">
              <Form.Item
                label="Downtime Distribution"
                name={['downtimePerEvent', 'distribution']}
              >
                <Select>
                  <Option value="Weibull">Weibull</Option>
                  <Option value="Lognormal">Lognormal</Option>
                  <Option value="Exponential">Exponential</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                label="Scale Parameter (hours)"
                name={['downtimePerEvent', 'scale']}
                tooltip="For Weibull: Scale parameter; For Lognormal: Median value"
              >
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                label="Shape Parameter"
                name={['downtimePerEvent', 'shape']}
                tooltip="For Weibull: Shape parameter; For Lognormal: Sigma parameter"
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </TabPane>
          
          <TabPane tab="Wind Variability" key="wind">
            <Card title="Wind Variability Simulation Method">
              <Form.Item
                label="Method"
                name="windVariabilityMethod"
              >
                <Radio.Group>
                  <Radio value="Default">Default</Radio>
                  <Radio value="Kaimal">Industry Standard (Kaimal/IEC 61400-1)</Radio>
                </Radio.Group>
              </Form.Item>
              
              {revenueParams.windVariabilityMethod === 'Kaimal' && (
                <>
                  <Form.Item
                    label="Turbulence Intensity (%)"
                    name="turbulenceIntensity"
                    tooltip="Percentage of mean wind speed"
                  >
                    <InputNumber min={0} max={30} step={1} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    label="Surface Roughness Length (m)"
                    name="surfaceRoughness"
                    tooltip="Characteristic of the terrain"
                  >
                    <InputNumber min={0.001} max={1} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    label="Kaimal Scale Parameter (m)"
                    name="kaimalScale"
                  >
                    <InputNumber min={1} max={20} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Form>
    </div>
  );
};

export default RevenueInputs;