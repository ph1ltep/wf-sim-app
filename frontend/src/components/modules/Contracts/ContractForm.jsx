// src/components/modules/Contracts/ContractForm.jsx
import React from 'react';
import { 
  Form, 
  Input, 
  Row, 
  Col, 
  InputNumber, 
  Select, 
  Switch,
  Tooltip,
  Space,
  Button
} from 'antd';
import { InfoCircleOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * OEM Contract Form component
 */
const ContractForm = ({ form, oemScopes = [] }) => {
  // Add a year range to the years field
  const addYearRange = () => {
    const values = form.getFieldValue('years') || [];
    
    // Find the max year if it exists
    let nextYear = 1;
    if (values.length > 0) {
      nextYear = Math.max(...values) + 1;
    }
    
    // Add the next 5 years
    const newYears = [...values];
    for (let i = 0; i < 5; i++) {
      if (!newYears.includes(nextYear + i)) {
        newYears.push(nextYear + i);
      }
    }
    
    // Sort years
    newYears.sort((a, b) => a - b);
    form.setFieldsValue({ years: newYears });
  };

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Form.Item
        name="name"
        label="Contract Name"
        rules={[{ required: true, message: 'Please enter contract name' }]}
      >
        <Input placeholder="e.g., Basic OEM Contract (Years 1-5)" />
      </Form.Item>
      
      <Form.Item
        name="years"
        label={
          <Space>
            Years Covered
            <Tooltip title="Select which project years this contract covers">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
        rules={[{ required: true, message: 'Please specify years covered by contract' }]}
      >
        <Select
          mode="multiple"
          placeholder="Select years covered by contract"
          style={{ width: '100%' }}
          options={Array.from({ length: 30 }, (_, i) => ({ 
            label: `Year ${i + 1}`, 
            value: i + 1 
          }))}
        />
      </Form.Item>
      
      <Row>
        <Col>
          <Button 
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addYearRange}
            style={{ marginBottom: 16 }}
          >
            Add 5 Year Range
          </Button>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={18}>
          <Form.Item
            name="fixedFee"
            label="Fixed Fee"
            rules={[{ required: true, message: 'Please enter fixed fee' }]}
          >
            <InputNumber 
              min={0} 
              step={1000} 
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="isPerTurbine"
            label="Per Turbine"
            valuePropName="checked"
            tooltip="If checked, the fee is per turbine per year, otherwise it's the total fee per year"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        name="oemScopeId"
        label="OEM Scope"
        rules={[{ required: true, message: 'Please select an OEM scope' }]}
      >
        <Select
          placeholder="Select an OEM scope"
          optionFilterProp="children"
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {oemScopes.map(scope => (
            <Option key={scope.id} value={scope.id}>{scope.name}</Option>
          ))}
        </Select>
      </Form.Item>

      {/* Hidden field to store the name of the selected scope */}
      <Form.Item name="oemScopeName" hidden>
        <Input />
      </Form.Item>
    </Form>
  );
};

export default ContractForm;