// src/components/config/oemScopes/oemScopeColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import OEMScopeTag from './OEMScopeTag';

/**
 * Format currency to display with $ sign and commas
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (value) => {
  if (!value) return '';
  return `$${value.toLocaleString()}`;
};

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
    title: 'Scope',
    key: 'scope',
    render: (_, record) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {/* Always render conditionally based on the actual values */}
        {record.preventiveMaintenance === true && <OEMScopeTag color="#52c41a">PM</OEMScopeTag>}
        {record.bladeInspections === true && <OEMScopeTag color="#1890ff">BI</OEMScopeTag>}
        
        {record.remoteMonitoring === true && <OEMScopeTag color="#13c2c2">RM</OEMScopeTag>}
        {record.remoteTechnicalSupport === true && <OEMScopeTag color="#096dd9">RTS</OEMScopeTag>}
        
        {record.siteManagement === true && <OEMScopeTag color="#fa8c16">SM</OEMScopeTag>}
        {typeof record.technicianPercent === 'number' && record.technicianPercent > 0 && (
          <OEMScopeTag color="#faad14">
            Tech: {record.technicianPercent}%
          </OEMScopeTag>
        )}
        
        {record.correctiveMinor === true && <OEMScopeTag color="#eb2f96">Minor</OEMScopeTag>}
        {record.bladeIntegrityManagement === true && <OEMScopeTag color="#722ed1">BIM</OEMScopeTag>}
        
        {/* Crane Coverage is now separate from Major Components */}
        {record.craneCoverage === true && (
          <Tooltip title={
            <>
              <div>Crane coverage for major component replacements</div>
              {record.craneEventCap > 0 && <div>Event Cap: {record.craneEventCap}/year</div>}
              {record.craneFinancialCap > 0 && <div>Financial Cap: {formatCurrency(record.craneFinancialCap)}/year</div>}
            </>
          }>
            <OEMScopeTag color="#ff7a45">
              Crane
              {(record.craneEventCap > 0 || record.craneFinancialCap > 0) && " (Capped)"}
            </OEMScopeTag>
          </Tooltip>
        )}
        
        {record.correctiveMajor === true && (
          <Tooltip title={
            <>
              {record.correctiveMajorDetails?.tooling === true && <div>Tooling</div>}
              {record.correctiveMajorDetails?.manpower === true && <div>Manpower</div>}
              {record.correctiveMajorDetails?.parts === true && <div>Parts</div>}
              {record.majorEventCap > 0 && <div>Event Cap: {record.majorEventCap}/year</div>}
              {record.majorFinancialCap > 0 && <div>Financial Cap: {formatCurrency(record.majorFinancialCap)}/year</div>}
            </>
          }>
            <OEMScopeTag color="#f5222d">
              Major
              {record.correctiveMajorDetails && 
                [
                  record.correctiveMajorDetails.tooling === true ? 'T' : '',
                  record.correctiveMajorDetails.manpower === true ? 'M' : '',
                  record.correctiveMajorDetails.parts === true ? 'P' : ''
                ].filter(Boolean).length > 0 && 
                ` (${[
                  record.correctiveMajorDetails.tooling === true ? 'T' : '',
                  record.correctiveMajorDetails.manpower === true ? 'M' : '',
                  record.correctiveMajorDetails.parts === true ? 'P' : ''
                ].filter(Boolean).join('')})`
              }
              {(record.majorEventCap > 0 || record.majorFinancialCap > 0) && 
                (record.correctiveMajorDetails && 
                  [
                    record.correctiveMajorDetails.tooling === true ? 'T' : '',
                    record.correctiveMajorDetails.manpower === true ? 'M' : '',
                    record.correctiveMajorDetails.parts === true ? 'P' : ''
                  ].filter(Boolean).length > 0 ? 
                  " Capped" : " (Capped)")
              }
            </OEMScopeTag>
          </Tooltip>
        )}
      </div>
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