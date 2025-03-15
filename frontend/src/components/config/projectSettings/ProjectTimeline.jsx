// src/components/config/projectSettings/ProjectTimeline.jsx
import React from 'react';
import { Form, InputNumber, Card } from 'antd';

/**
 * Component for project timeline settings
 */
const ProjectTimeline = () => {
  return (
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
  );
};

export default ProjectTimeline;
