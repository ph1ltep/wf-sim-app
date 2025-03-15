// frontend/src/components/config/oemContracts/OEMContractForm.jsx
import React, { useEffect } from 'react';
import { 
  Form, 
  Input, 
  Row, 
  Col, 
  InputNumber, 
  Select, 
  Switch
} from 'antd';

const { Option } = Select;

/**
 * OEM Contract Form component
 */
const OEMContractForm = ({ 
  form, 
  initialValues = {}, 
  oemScopes = [] 
}) => {
  // Set form values when initialValues changes
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      // Create a clean form values object
      const formValues = {
        ...initialValues,
        // Handle references correctly
        oemScope: initialValues.oemScope?._id || initialValues.oemScope
      };
      
      console.log('Setting form values:', formValues);
      form.setFieldsValue(formValues);
    }
  }, [form, initialValues]);

  // Generate a default name based on form values
  const generateAutoName = (values) => {
    // Skip if no values
    if (!values) return '';
    
    // Find the selected scope
    const selectedScope = oemScopes.find(scope => scope.value === values.oemScope);
    const scopeName = selectedScope?.label || 'Standard OEM';
    
    // Generate name based on term and scope
    return `${scopeName} (Year ${values.startYear || 1}-${values.endYear || 5})`;
  };

  // Handle values change for auto-generating name
  const handleValuesChange = (changedValues, allValues) => {
    // If name is empty or user is changing term-related values, auto-generate name
    if (!form.getFieldValue('name') || changedValues.startYear || changedValues.endYear || changedValues.oemScope) {
      const autoName = generateAutoName(allValues);
      form.setFieldValue('name', autoName);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
    >
      <Form.Item
        name="name"
        label="Contract Name"
        rules={[{ required: true, message: 'Please enter contract name' }]}
      >
        <Input placeholder="e.g., Basic OEM Contract (Years 1-5)" />
      </Form.Item>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="startYear"
            label="Start Year"
            rules={[{ required: true, message: 'Please enter start year' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="endYear"
            label="End Year"
            rules={[{ required: true, message: 'Please enter end year' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
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
        name="oemScope"
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
            <Option key={scope.value} value={scope.value}>{scope.label}</Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};

export default OEMContractForm;