// src/components/config/oemScopes/OEMScopeForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Row, 
  Col, 
  Button, 
  Checkbox, 
  Divider, 
  Typography,
  InputNumber
} from 'antd';

const { Text } = Typography;

const OEMScopeForm = ({ 
  form, 
  initialValues = {}, 
  onGenerateName, 
  generateNameLoading = false 
}) => {
  const [correctiveMajorSelected, setCorrectiveMajorSelected] = useState(
    initialValues.correctiveMajor || false
  );

  // Set form values when initialValues changes
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      const formValues = {
        ...initialValues,
        // Handle nested correctiveMajorDetails properly
        ...initialValues.correctiveMajorDetails && {
          'correctiveMajorDetails.crane': initialValues.correctiveMajorDetails.crane,
          'correctiveMajorDetails.tooling': initialValues.correctiveMajorDetails.tooling,
          'correctiveMajorDetails.manpower': initialValues.correctiveMajorDetails.manpower,
          'correctiveMajorDetails.parts': initialValues.correctiveMajorDetails.parts,
        },
        // Set technicians percent to default if not present
        technicianPercent: initialValues.technicianPercent !== undefined ? initialValues.technicianPercent : 100
      };
      
      form.setFieldsValue(formValues);
      setCorrectiveMajorSelected(initialValues.correctiveMajor || false);
    } else {
      // Set defaults for new forms
      form.setFieldsValue({
        technicianPercent: 100
      });
    }
  }, [form, initialValues]);

  // Handle form value changes
  const handleValuesChange = (changedValues) => {
    // Check if correctiveMajor changed
    if ('correctiveMajor' in changedValues) {
      setCorrectiveMajorSelected(changedValues.correctiveMajor);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
    >
      <Row gutter={16}>
        <Col span={18}>
          <Form.Item
            name="name"
            label="Scope Name"
            rules={[{ required: true, message: 'Please enter scope name' }]}
          >
            <Input placeholder="e.g., Full-Service-OEM" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Button 
            onClick={onGenerateName} 
            style={{ marginTop: 29 }}
            loading={generateNameLoading}
          >
            Generate Name
          </Button>
        </Col>
      </Row>
      
      <Divider orientation="left">Preventive Maintenance</Divider>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="preventiveMaintenance"
            valuePropName="checked"
          >
            <Checkbox>Regular Maintenance</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="bladeInspections"
            valuePropName="checked"
          >
            <Checkbox>Blade Inspections</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      
      <Divider orientation="left">Remote Support</Divider>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="remoteMonitoring"
            valuePropName="checked"
          >
            <Checkbox>Remote Monitoring</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="remoteTechnicalSupport"
            valuePropName="checked"
          >
            <Checkbox>Remote Technical Support</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      
      <Divider orientation="left">Site Personnel</Divider>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="siteManagement"
            valuePropName="checked"
          >
            <Checkbox>Site Management</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="technicianPercent"
            label="Technicians (%)"
            tooltip="Percentage of technicians provided (0-100%)"
          >
            <InputNumber
              min={0}
              max={100}
              step={5}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Divider orientation="left">Corrective Maintenance</Divider>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="correctiveMinor"
            valuePropName="checked"
          >
            <Checkbox>Minor Components</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="bladeIntegrityManagement"
            valuePropName="checked"
          >
            <Checkbox>Blade Integrity Management</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="correctiveMajor"
            valuePropName="checked"
          >
            <Checkbox>Major Components</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      
      {correctiveMajorSelected && (
        <div style={{ marginLeft: 24, borderLeft: '1px solid #f0f0f0', paddingLeft: 12 }}>
          <Text strong>Major Component Details:</Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <Form.Item
                name="correctiveMajorDetails.crane"
                valuePropName="checked"
              >
                <Checkbox>Crane</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="correctiveMajorDetails.tooling"
                valuePropName="checked"
              >
                <Checkbox>Tooling</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="correctiveMajorDetails.manpower"
                valuePropName="checked"
              >
                <Checkbox>Manpower</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="correctiveMajorDetails.parts"
                valuePropName="checked"
              >
                <Checkbox>Parts</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </div>
      )}
    </Form>
  );
};

export default OEMScopeForm;