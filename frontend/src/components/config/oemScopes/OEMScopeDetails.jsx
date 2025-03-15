// src/components/config/oemScopes/OEMScopeDetails.jsx
import React from 'react';
import { Row, Col, Typography } from 'antd';

const { Title } = Typography;

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
            <li>Major Components: {record.correctiveMajor ? 'Yes' : 'No'}</li>
            {record.correctiveMajor && record.correctiveMajorDetails && (
              <ul style={{ paddingLeft: '20px' }}>
                <li>Crane: {record.correctiveMajorDetails.crane ? 'Yes' : 'No'}</li>
                <li>Tooling: {record.correctiveMajorDetails.tooling ? 'Yes' : 'No'}</li>
                <li>Manpower: {record.correctiveMajorDetails.manpower ? 'Yes' : 'No'}</li>
                <li>Parts: {record.correctiveMajorDetails.parts ? 'Yes' : 'No'}</li>
              </ul>
            )}
          </ul>
        </Col>
      </Row>
    </div>
  );
};

export default OEMScopeDetails;