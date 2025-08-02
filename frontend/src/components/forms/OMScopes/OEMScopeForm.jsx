// frontend/src/components/forms/OMScopes/OEMScopeForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Row, Col, Button, Checkbox, Divider, Typography, InputNumber, Select } from 'antd';

const { Text } = Typography;
const { Option } = Select;

const OEMScopeForm = ({
  form,
  initialValues = {},
  onGenerateName
}) => {
  const [correctiveMajorSelected, setCorrectiveMajorSelected] = useState(
    initialValues.correctiveMajor || false
  );

  const [craneSelected, setCraneSelected] = useState(
    initialValues.craneCoverage || false
  );

  // Set form values when initialValues changes
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      // Create a clean form values object
      const formValues = {
        ...initialValues,
      };

      // Handle nested correctiveMajorDetails properly
      if (initialValues.correctiveMajorDetails) {
        formValues['correctiveMajorDetails.tooling'] = !!initialValues.correctiveMajorDetails.tooling;
        formValues['correctiveMajorDetails.manpower'] = !!initialValues.correctiveMajorDetails.manpower;
        formValues['correctiveMajorDetails.parts'] = !!initialValues.correctiveMajorDetails.parts;
      }

      // Ensure technician percent is set properly
      formValues.technicianPercent = initialValues.technicianPercent !== undefined ?
        initialValues.technicianPercent :
        (initialValues.siteManagement ? 100 : 0);

      // Set form values
      form.setFieldsValue(formValues);
      setCorrectiveMajorSelected(initialValues.correctiveMajor || false);
      setCraneSelected(initialValues.craneCoverage || false);
    } else {
      // Set defaults for new forms
      form.setFieldsValue({
        technicianPercent: 100
      });
    }
  }, [form, initialValues]);

  // Updated handleValuesChange function in OEMScopeForm.jsx
  const handleValuesChange = (changedValues) => {
    // Check if correctiveMajor changed
    if ('correctiveMajor' in changedValues) {
      setCorrectiveMajorSelected(changedValues.correctiveMajor);
    }

    // Check if craneCoverage changed
    if ('craneCoverage' in changedValues) {
      setCraneSelected(changedValues.craneCoverage);
    }

    // If site management is toggled off, reset technician percent to 0
    if ('siteManagement' in changedValues) {
      const siteManagementEnabled = changedValues.siteManagement;
      if (!siteManagementEnabled) {
        // Use setTimeout to avoid direct state mutation during render
        setTimeout(() => {
          form.setFieldsValue({ technicianPercent: 0 });
        }, 0);
      } else {
        // If site management is toggled on, set technician percent to 100 (default)
        setTimeout(() => {
          form.setFieldsValue({ technicianPercent: 100 });
        }, 0);
      }
    }
  };

  const handleGenerateName = () => {
    try {
      // Simply pass the raw form values to the hook
      const values = form.getFieldsValue();
      onGenerateName(values);
    } catch (error) {
      console.error("Error preparing data for name generation:", error);
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
            onClick={handleGenerateName}
            style={{ marginTop: 29 }}
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
            dependencies={['siteManagement']}
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
            name="craneCoverage"
            valuePropName="checked"
          >
            <Checkbox>Crane Coverage</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="correctiveMajor"
            valuePropName="checked"
          >
            <Checkbox>Major Components</Checkbox>
          </Form.Item>
        </Col>
      </Row>

      {craneSelected && (
        <div style={{ marginLeft: 24, borderLeft: '1px solid #f0f0f0', paddingLeft: 12, marginBottom: 16 }}>
          <Text strong>Crane Coverage Details:</Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <Form.Item
                label="Event Cap"
                name="craneEventCap"
                tooltip="Maximum number of crane events covered per year"
              >
                <InputNumber min={0} placeholder="Events/year" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Financial Cap"
                name="craneFinancialCap"
                tooltip="Maximum financial coverage per year"
              >
                <InputNumber
                  min={0}
                  step={10000}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="USD/year"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )}

      {correctiveMajorSelected && (
        <div style={{ marginLeft: 24, borderLeft: '1px solid #f0f0f0', paddingLeft: 12 }}>
          <Text strong>Major Component Details:</Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <Form.Item
                name="correctiveMajorDetails.tooling"
                valuePropName="checked"
              >
                <Checkbox>Tooling</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="correctiveMajorDetails.manpower"
                valuePropName="checked"
              >
                <Checkbox>Manpower</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="correctiveMajorDetails.parts"
                valuePropName="checked"
              >
                <Checkbox>Parts</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Event Cap"
                name="majorEventCap"
                tooltip="Maximum number of major component events covered per year"
              >
                <InputNumber min={0} placeholder="Events/year" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Financial Cap"
                name="majorFinancialCap"
                tooltip="Maximum financial coverage per year"
              >
                <InputNumber
                  min={0}
                  step={10000}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="USD/year"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )}
    </Form>
  );
};

export default OEMScopeForm;