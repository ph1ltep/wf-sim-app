// src/components/config/ProjectSettings.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Form, InputNumber, Card, Button, Row, Col, Statistic, Tooltip, Divider } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const ProjectSettings = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();
  const [calculatedValues, setCalculatedValues] = useState({
    totalMW: 0,
    grossAEP: 0,
    netAEP: 0
  });

  // Only render if parameters are loaded
  if (!parameters || !parameters.general) {
    return <div>Loading parameters...</div>;
  }

  // Recalculate total MW and estimated AEP whenever form values change
  const calculateDerivedValues = (values) => {
    const numWTGs = values.numWTGs || 0;
    const mwPerWTG = values.mwPerWTG || 0;
    const capacityFactor = values.capacityFactor || 0;
    const curtailmentLosses = values.curtailmentLosses || 0;
    const electricalLosses = values.electricalLosses || 0;
    
    const totalMW = numWTGs * mwPerWTG;
    // Gross AEP = Total MW * Capacity Factor * Hours in a year
    const grossAEP = totalMW * (capacityFactor / 100) * 8760;
    
    // Net AEP after losses:
    // First apply curtailment losses
    const afterCurtailment = grossAEP * (1 - curtailmentLosses / 100);
    // Then apply electrical losses
    const netAEP = afterCurtailment * (1 - electricalLosses / 100);
    
    const updatedValues = {
      totalMW: totalMW,
      grossAEP: grossAEP,
      netAEP: netAEP
    };
    
    setCalculatedValues(updatedValues);
    
    // Save calculated values to the parameters
    updateModuleParameters('projectMetrics', updatedValues);
  };

  // Calculate initial values
  useEffect(() => {
    if (parameters.general) {
      calculateDerivedValues(parameters.general);
    }
  }, [parameters.general]);

  const handleValuesChange = (changedValues, allValues) => {
    // Recalculate derived values
    calculateDerivedValues(allValues);
    
    // Update general parameters
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('general', allValues);
    }
  };

  const handleReset = () => {
    form.resetFields();
    // Recalculate with reset values
    calculateDerivedValues(form.getFieldsValue());
  };

  return (
    <div>
      <Title level={2}>Project Specifics</Title>
      <p>Configure the basic parameters for your wind farm project.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={parameters.general}
        onValuesChange={handleValuesChange}
      >
        <Card title="Project Timeline" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Project Life (Years)"
            name="projectLife"
            rules={[{ required: true, message: 'Please input project life!' }]}
            tooltip="The total operational lifetime of the wind farm project"
          >
            <InputNumber min={1} max={50} />
          </Form.Item>
        </Card>

        <Card title="Wind Farm Specifications" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Number of WTGs"
                name="numWTGs"
                rules={[{ required: true, message: 'Please input number of wind turbines!' }]}
                tooltip="Number of wind turbine generators in the project"
              >
                <InputNumber min={1} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Megawatts per WTG"
                name="mwPerWTG"
                rules={[{ required: true, message: 'Please input MW per turbine!' }]}
                tooltip="Nameplate capacity of each wind turbine in megawatts"
              >
                <InputNumber min={0.1} step={0.1} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Capacity Factor (%)"
                name="capacityFactor"
                rules={[{ required: true, message: 'Please input capacity factor!' }]}
                tooltip="Expected capacity factor as a percentage of nameplate capacity"
              >
                <InputNumber 
                  min={1} 
                  max={60} 
                  step={0.5} 
                  precision={1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">Energy Losses</Divider>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Curtailment Losses (%)
                    <Tooltip title="Energy losses due to grid curtailment or operational restrictions">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                name="curtailmentLosses"
                initialValue={0}
              >
                <InputNumber 
                  min={0} 
                  max={30} 
                  step={0.5} 
                  precision={1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Electrical Losses (%)
                    <Tooltip title="Energy losses in electrical systems, transformers, and transmission">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                name="electricalLosses"
                initialValue={0}
              >
                <InputNumber 
                  min={0} 
                  max={15} 
                  step={0.5} 
                  precision={1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Calculated Project Metrics">
          <Row gutter={24}>
            <Col span={8}>
              <Statistic
                title="Total Project Capacity"
                value={calculatedValues.totalMW}
                precision={2}
                suffix="MW"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Estimated AEP (Gross)"
                value={calculatedValues.grossAEP}
                precision={0}
                formatter={value => `${(value / 1000).toFixed(2)} GWh`}
              />
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                ({calculatedValues.grossAEP.toLocaleString()} MWh)
              </div>
            </Col>
            <Col span={8}>
              <Statistic
                title="Estimated AEP (Net)"
                value={calculatedValues.netAEP}
                precision={0}
                formatter={value => `${(value / 1000).toFixed(2)} GWh`}
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                ({calculatedValues.netAEP.toLocaleString()} MWh)
              </div>
            </Col>
          </Row>
        </Card>

        <Row justify="end">
          <Col>
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ProjectSettings;