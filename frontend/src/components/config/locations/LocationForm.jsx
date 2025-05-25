// src/components/config/locations/LocationForm.jsx
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';

// Import Context Field Layout components for visual consistency
import {
  FormSection,
  ResponsiveFieldRow,
  CompactFieldGroup
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

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <FormSection title="Basic Information">
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

      <FormSection title="Economic Parameters">
        <ResponsiveFieldRow layout="twoColumn">
          <Form.Item
            name="inflationRate"
            label="Inflation Rate (%)"
            rules={[{ required: true, message: 'Please enter inflation rate' }]}
          >
            <InputNumber
              min={-5}
              max={100}
              step={0.1}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
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
        </ResponsiveFieldRow>

        <ResponsiveFieldRow layout="oneColumn">
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
        </ResponsiveFieldRow>
      </FormSection>

      <FormSection title="Financial Parameters">
        <CompactFieldGroup direction="vertical" size="middle">
          <ResponsiveFieldRow layout="twoColumn">
            <Form.Item
              name="costOfConstructionDebt"
              label="Construction Debt Interest Rate (%)"
              rules={[{ required: true, message: 'Please enter construction debt rate' }]}
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
            <Form.Item
              name="costOfOperationalDebt"
              label="Operational Debt Interest Rate (%)"
              rules={[{ required: true, message: 'Please enter operational debt rate' }]}
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
          </ResponsiveFieldRow>

          <ResponsiveFieldRow layout="twoColumn">
            <Form.Item
              name="costofEquity"
              label="Cost of Equity (%)"
              rules={[{ required: true, message: 'Please enter cost of equity' }]}
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
            <Form.Item
              name="debtRatio"
              label="Debt Ratio (%)"
              rules={[{ required: true, message: 'Please enter debt ratio' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={1}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </ResponsiveFieldRow>

          <ResponsiveFieldRow layout="oneColumn">
            <Form.Item
              name="effectiveTaxRate"
              label="Effective Corporate Tax Rate (%)"
              rules={[{ required: true, message: 'Please enter effective tax rate' }]}
            >
              <InputNumber
                min={0}
                max={50}
                step={0.5}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </ResponsiveFieldRow>
        </CompactFieldGroup>
      </FormSection>

      <FormSection title="Currency Settings">
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
              style={{ width: '100%' }}
            />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>
    </Form>
  );
};

export default LocationForm;