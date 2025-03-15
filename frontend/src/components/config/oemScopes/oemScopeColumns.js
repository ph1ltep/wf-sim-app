// src/components/config/oemScopes/oemScopeColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import OEMScopeTag from './OEMScopeTag';

/**
 * Generate table columns for OEM scopes
 * @param {Function} handleEdit - Function to handle edit action
 * @param {Function} handleDelete - Function to handle delete action
 * @returns {Array} Array of column definitions
 */
export const getOEMScopeColumns = (handleEdit, handleDelete) => [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: 'Preventive',
    key: 'preventive',
    render: (_, record) => (
      <Space direction="vertical" size="small">
        {record.preventiveMaintenance && <OEMScopeTag color="green">PM</OEMScopeTag>}
        {record.bladeInspections && <OEMScopeTag color="blue">Blade Insp</OEMScopeTag>}
      </Space>
    )
  },
  {
    title: 'Remote/Site',
    key: 'remote',
    render: (_, record) => (
      <Space direction="vertical" size="small">
        {record.remoteMonitoring && <OEMScopeTag color="cyan">Monitoring</OEMScopeTag>}
        {record.remoteTechnicalSupport && <OEMScopeTag color="blue">Tech Support</OEMScopeTag>}
        {record.siteManagement && <OEMScopeTag color="orange">Site Mgmt</OEMScopeTag>}
        {record.technicianPercent > 0 && (
          <OEMScopeTag color="gold">
            Techs: {record.technicianPercent}%
          </OEMScopeTag>
        )}
      </Space>
    )
  },
  {
    title: 'Corrective',
    key: 'corrective',
    render: (_, record) => (
      <Space direction="vertical" size="small">
        {record.correctiveMinor && <OEMScopeTag color="gold">Minor</OEMScopeTag>}
        {record.bladeIntegrityManagement && <OEMScopeTag color="purple">Blade Integrity</OEMScopeTag>}
        {record.correctiveMajor && (
          <Tooltip title={
            <>
              {record.correctiveMajorDetails?.crane && <div>Crane</div>}
              {record.correctiveMajorDetails?.tooling && <div>Tooling</div>}
              {record.correctiveMajorDetails?.manpower && <div>Manpower</div>}
              {record.correctiveMajorDetails?.parts && <div>Parts</div>}
            </>
          }>
            <OEMScopeTag color="volcano">Major</OEMScopeTag>
          </Tooltip>
        )}
      </Space>
    )
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => {
      return (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            type="text" 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this OEM scope?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger 
            />
          </Popconfirm>
        </Space>
      );
    },
  },
];