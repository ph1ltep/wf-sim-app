// src/components/config/projectSettings/WindFarmSpecifications.jsx
import React from 'react';
import { Form, InputNumber, Select, Card, Row, Col, Divider, Tooltip } from 'antd';
import { InfoCircleOutlined, GlobalOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * Component for wind farm specifications form
 */
const WindFarmSpecifications = ({ fieldsFromLocations }) => {
  return (
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
            label="WTG Platform Type"
            name="wtgPlatformType"
            rules={[{ required: true, message: 'Please select WTG platform type!' }]}
            tooltip="Type of wind turbine generator platform"
          >
            <Select placeholder="Select WTG platform type">
              <Option value="geared">Geared</Option>
              <Option value="direct-drive">Direct Drive</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={24}>
        <Col span={8}>
          <Form.Item
            label={
              <span>
                Capacity Factor (%)
                {fieldsFromLocations.capacityFactor && 
                  <Tooltip title="Value from location defaults">
                    <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                  </Tooltip>
                }
              </span>
            }
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
        <Col span={16}></Col>
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
  );
};

export default WindFarmSpecifications;