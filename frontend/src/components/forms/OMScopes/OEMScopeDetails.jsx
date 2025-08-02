// frontend/src/components/forms/OMScopes/OEMScopeDetails.jsx
import React from 'react';
import { Row, Col, Typography, Descriptions, Tag } from 'antd';

const { Title } = Typography;

/**
 * Format currency to display with $ sign and commas
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (value) => {
  if (!value) return 'N/A';
  return `$${value.toLocaleString()}`;
};

/**
 * Component to display detailed information about an OEM scope
 * Used in expandable table rows
 */
const OEMScopeDetails = ({ record }) => {
  return (
    <div style={{ margin: 0 }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Title level={5}>Preventive Maintenance</Title>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Regular Maintenance: {record.preventiveMaintenance ? 'Yes' : 'No'}</li>
            <li>Blade Inspections: {record.bladeInspections ? 'Yes' : 'No'}</li>
          </ul>
        </Col>
        <Col span={8}>
          <Title level={5}>Remote & Site Support</Title>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Remote Monitoring: {record.remoteMonitoring ? 'Yes' : 'No'}</li>
            <li>Remote Technical Support: {record.remoteTechnicalSupport ? 'Yes' : 'No'}</li>
            <li>Site Management: {record.siteManagement ? 'Yes' : 'No'}</li>
            <li>Technicians: {record.technicianPercent !== undefined ? `${record.technicianPercent}%` : 'N/A'}</li>
          </ul>
        </Col>
        <Col span={8}>
          <Title level={5}>Corrective Maintenance</Title>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Minor Components: {record.correctiveMinor ? 'Yes' : 'No'}</li>
            <li>Blade Integrity Management: {record.bladeIntegrityManagement ? 'Yes' : 'No'}</li>
          </ul>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Title level={5}>Crane Coverage</Title>
          {record.craneCoverage ? (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Coverage">Yes</Descriptions.Item>
              <Descriptions.Item label="Event Cap">
                {record.craneEventCap > 0 ? `${record.craneEventCap} events/year` : 'No cap'}
              </Descriptions.Item>
              <Descriptions.Item label="Financial Cap">
                {record.craneFinancialCap > 0 ? formatCurrency(record.craneFinancialCap) + '/year' : 'No cap'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Tag color="red">Not Covered</Tag>
          )}
        </Col>

        <Col span={12}>
          <Title level={5}>Major Components</Title>
          {record.correctiveMajor ? (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Coverage">Yes</Descriptions.Item>
              <Descriptions.Item label="Tooling">{record.correctiveMajorDetails?.tooling ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Manpower">{record.correctiveMajorDetails?.manpower ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Parts">{record.correctiveMajorDetails?.parts ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Event Cap">
                {record.majorEventCap > 0 ? `${record.majorEventCap} events/year` : 'No cap'}
              </Descriptions.Item>
              <Descriptions.Item label="Financial Cap">
                {record.majorFinancialCap > 0 ? formatCurrency(record.majorFinancialCap) + '/year' : 'No cap'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Tag color="red">Not Covered</Tag>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default OEMScopeDetails;