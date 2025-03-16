// frontend/src/components/config/oemContracts/OEMContractForm.jsx
import React from 'react';
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
const OEMContractForm = ({ form, oemScopes = [] }) => {
  // Get the selected OEM scope
  const oemScopeId = Form.useWatch('oemScopeId', form);
  const selectedScope = oemScopes.find(scope => scope.id === oemScopeId);

  // When scope changes, update the oemScopeName field
  React.useEffect(() => {
    if (selectedScope) {
      form.setFieldValue('oemScopeName', selectedScope.name);
    }
  }, [selectedScope, form]);

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

export default OEMContractForm;