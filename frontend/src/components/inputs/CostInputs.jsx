// src/components/inputs/CostInputs.jsx
import React from 'react';
import { Typography, Form, InputNumber, Select, Card, Divider, Tabs } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const CostInputs = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters || !parameters.cost) {
    return <div>Loading parameters...</div>;
  }

  const costParams = parameters.cost;

  const handleValuesChange = (changedValues, allValues) => {
    // Only update if we have actual changed values
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('cost', allValues);
    }
  };

  return (
    <div>
      <Title level={2}>Cost Module Configuration</Title>
      <p>Configure the cost parameters for the wind farm simulation.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={costParams}
        onValuesChange={handleValuesChange}
      >
        <Tabs defaultActiveKey="routine">
          <TabPane tab="Routine O&M" key="routine">
            <Card title="Base O&M Costs">
              <Form.Item
                label="Annual Base O&M Cost (USD/year)"
                name="annualBaseOM"
                rules={[{ required: true, message: 'Please input annual base O&M cost!' }]}
              >
                <InputNumber 
                  min={0} 
                  step={100000} 
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                label="O&M Cost Escalation Rate (%/year)"
                name="escalationRate"
                rules={[{ required: true, message: 'Please input escalation rate!' }]}
              >
                <InputNumber 
                  min={0} 
                  max={10} 
                  step={0.1} 
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Escalation Distribution"
                name="escalationDistribution"
                tooltip="Distribution type for the escalation rate uncertainty"
              >
                <Select>
                  <Option value="Normal">Normal</Option>
                  <Option value="Lognormal">Lognormal</Option>
                  <Option value="Triangular">Triangular</Option>
                  <Option value="Uniform">Uniform</Option>
                </Select>
              </Form.Item>
            </Card>
          </TabPane>
          
          <TabPane tab="OEM Contract" key="oem">
            <Card title="OEM Services">
              <Form.Item
                label="OEM Term (Years)"
                name="oemTerm"
                tooltip="Number of years covered by the OEM warranty/service agreement"
              >
                <InputNumber min={0} max={20} />
              </Form.Item>
              
              <Form.Item
                label="Fixed O&M Fee during OEM Term / year (USD)"
                name="fixedOMFee"
                tooltip="Annual fixed fee during OEM coverage period"
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
          </TabPane>
          
          <TabPane tab="Failures" key="failures">
            <Card title="Failure Events">
              <Form.Item
                label="Failure Event Probability (%/year)"
                name="failureEventProbability"
                tooltip="Annual probability of a failure event occurring"
              >
                <InputNumber 
                  min={0} 
                  max={100} 
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Failure Event Cost (USD per event)"
                name="failureEventCost"
                tooltip="Average cost of each failure event"
              >
                <InputNumber 
                  min={0} 
                  step={10000} 
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Card>
          </TabPane>
          
          <TabPane tab="Major Repairs" key="major">
            <Card title="Major Repairs / Overhauls">
              <p>Configure deterministic or probabilistic major cost events (e.g., blade or gearbox replacements).</p>
              
              {/* This would be implemented with a dynamic form for adding major repair events */}
              <p>This feature will be implemented in a future version.</p>
            </Card>
          </TabPane>
        </Tabs>
      </Form>
    </div>
  );
};

export default CostInputs;