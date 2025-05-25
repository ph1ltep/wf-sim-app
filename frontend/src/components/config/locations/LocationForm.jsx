// src/components/config/locations/LocationForm.jsx
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';

// Import Context Field Layout components for visual consistency
import {
  FormSection,
  ResponsiveFieldRow,
  FormRow,
  FormCol
} from '../../contextFields';

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

  // Get current currency for energy price addon
  const currentCurrency = Form.useWatch('currency', form) || 'USD';

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <FormSection title="Basic Information" level={5}>
        <ResponsiveFieldRow layout="twoColumn">
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please enter country name' }]}
          >
            <Input placeholder="e.g., United States" />
          </Form.Item>
          <Form.Item
            name="countryCode"
            label="Country Code"
            rules={[{ required: true, message: 'Please enter country code' }]}
          >
            <Input placeholder="e.g., us" />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>

      <FormSection title="Economic Parameters" level={5}>
        {/* Custom column sizing: first two smaller, third larger */}
        <FormRow gutter={[16, 16]}>
          <FormCol xs={24} sm={12} md={7} lg={7} xl={7}>
            <Form.Item
              name="inflationRate"
              label="Inflation Rate"
              rules={[{ required: true, message: 'Please enter inflation rate' }]}
            >
              <InputNumber
                min={-5}
                max={100}
                step={0.1}
                precision={2}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </FormCol>
          <FormCol xs={24} sm={12} md={7} lg={7} xl={7}>
            <Form.Item
              name="capacityFactor"
              label="Capacity Factor"
              rules={[{ required: true, message: 'Please enter capacity factor' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                precision={2}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </FormCol>
          <FormCol xs={24} sm={24} md={10} lg={10} xl={10}>
            <Form.Item
              name="energyPrice"
              label="Energy Price"
              rules={[{ required: true, message: 'Please enter energy price' }]}
            >
              <InputNumber
                min={0}
                step={1}
                addonAfter={`${currentCurrency}/MWh`}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </FormCol>
        </FormRow>
      </FormSection>

      <FormSection title="Financial Parameters" level={5}>
        {/* Custom column sizing: first two larger, third smaller */}
        <FormRow gutter={[16, 16]}>
          <FormCol xs={24} sm={12} md={9} lg={9} xl={9}>
            <Form.Item
              name="costOfConstructionDebt"
              label="Construction Debt Rate"
              rules={[{ required: true, message: 'Please enter construction debt rate' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                precision={2}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </FormCol>
          <FormCol xs={24} sm={12} md={9} lg={9} xl={9}>
            <Form.Item
              name="costOfOperationalDebt"
              label="Operational Debt Rate"
              rules={[{ required: true, message: 'Please enter operational debt rate' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                precision={2}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </FormCol>
          <FormCol xs={24} sm={24} md={6} lg={6} xl={6}>
            <Form.Item
              name="costofEquity"
              label="Cost of Equity"
              rules={[{ required: true, message: 'Please enter cost of equity' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                precision={2}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </FormCol>
        </FormRow>

        <ResponsiveFieldRow layout="twoColumn">
          <Form.Item
            name="debtRatio"
            label="Debt Ratio"
            rules={[{ required: true, message: 'Please enter debt ratio' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={1}
              precision={2}
              addonAfter="%"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="effectiveTaxRate"
            label="Effective Tax Rate"
            rules={[{ required: true, message: 'Please enter effective tax rate' }]}
          >
            <InputNumber
              min={0}
              max={50}
              step={0.5}
              precision={2}
              addonAfter="%"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>

      <FormSection title="Currency Settings" level={5}>
        <ResponsiveFieldRow layout="twoColumn">
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
        </ResponsiveFieldRow>

        <ResponsiveFieldRow layout="oneColumn">
          <Form.Item
            name="exchangeRate"
            label="Foreign/Local Exchange Rate"
            help="Enter rate as: 1 foreign currency = ? local currency"
            rules={[{ required: true, message: 'Please enter exchange rate' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>
    </Form>
  );
};

export default LocationForm;