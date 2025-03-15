// src/components/config/locations/LocationForm.jsx
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Row, Col } from 'antd';

const { Option } = Select;

/**
 * Component for location form input fields
 */
const LocationForm = ({ form, initialValues = {}, currencies = [] }) => {
  // Set form values when initialValues changes
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
    }
  }, [form, initialValues]);

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please enter country name' }]}
          >
            <Input placeholder="e.g., United States" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="countryCode"
            label="Country Code"
            rules={[{ required: true, message: 'Please enter country code' }]}
          >
            <Input placeholder="e.g., us" />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="inflationRate"
            label="Inflation Rate (%)"
            rules={[{ required: true, message: 'Please enter inflation rate' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="capacityFactor"
            label="Capacity Factor (%)"
            rules={[{ required: true, message: 'Please enter capacity factor' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.5}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        name="energyPrice"
        label="Energy Price (per MWh)"
        rules={[{ required: true, message: 'Please enter energy price' }]}
      >
        <InputNumber
          min={0}
          step={1}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="currency"
            label="Local Currency"
            rules={[{ required: true, message: 'Please select currency' }]}
          >
            <Select placeholder="Select local currency">
              {currencies.map(currency => (
                <Option key={currency.value} value={currency.value}>{currency.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="foreignCurrency"
            label="Foreign Currency"
            rules={[{ required: true, message: 'Please select foreign currency' }]}
          >
            <Select placeholder="Select foreign currency">
              {currencies.map(currency => (
                <Option key={currency.value} value={currency.value}>{currency.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        name="exchangeRate"
        label="Foreign/Local Exchange Rate"
        help="Enter rate as: 1 foreign currency = ? local currency"
        rules={[{ required: true, message: 'Please enter exchange rate' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
};

export default LocationForm;