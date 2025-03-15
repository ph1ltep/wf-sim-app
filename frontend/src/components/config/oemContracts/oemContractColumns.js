// frontend/src/components/config/oemContracts/oemContractColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import OEMScopeTag from '../oemScopes/OEMScopeTag';

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
 * Generate table columns for OEM contracts
 * @param {Function} handleEdit - Function to handle edit action
 * @param {Function} handleDelete - Function to handle delete action
 * @returns {Array} Array of column definitions
 */
export const getOEMContractColumns = (handleEdit, handleDelete) => [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: 'Term',
    key: 'term',
    render: (_, record) => (
      <span>Year {record.startYear} - {record.endYear}</span>
    ),
    sorter: (a, b) => a.startYear - b.startYear,
  },
  {
    title: 'Fixed Fee',
    key: 'fixedFee',
    render: (_, record) => (
      <span>
        {formatCurrency(record.fixedFee)}{record.isPerTurbine ? '/WTG' : ''}/year
      </span>
    ),
    sorter: (a, b) => a.fixedFee - b.fixedFee,
  },
  {
    title: 'OEM Scope',
    key: 'scope',
    render: (_, record) => {
      // If oemScope is populated with full object
      const scope = record.oemScope;
      
      if (!scope) return <span>No scope selected</span>;
      
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {/* Always render conditionally based on the actual values */}
          {scope.preventiveMaintenance === true && <OEMScopeTag color="#52c41a">PM</OEMScopeTag>}
          {scope.bladeInspections === true && <OEMScopeTag color="#1890ff">BI</OEMScopeTag>}
          
          {scope.remoteMonitoring === true && <OEMScopeTag color="#13c2c2">RM</OEMScopeTag>}
          {scope.remoteTechnicalSupport === true && <OEMScopeTag color="#096dd9">RTS</OEMScopeTag>}
          
          {scope.siteManagement === true && <OEMScopeTag color="#fa8c16">SM</OEMScopeTag>}
          {typeof scope.technicianPercent === 'number' && scope.technicianPercent > 0 && (
            <OEMScopeTag color="#faad14">
              Tech: {scope.technicianPercent}%
            </OEMScopeTag>
          )}
          
          {scope.correctiveMinor === true && <OEMScopeTag color="#eb2f96">Minor</OEMScopeTag>}
          {scope.bladeIntegrityManagement === true && <OEMScopeTag color="#722ed1">BIM</OEMScopeTag>}
          
          {/* Crane Coverage is now separate from Major Components */}
          {scope.craneCoverage === true && (
            <OEMScopeTag color="#ff7a45">
              Crane
              {(scope.craneEventCap > 0 || scope.craneFinancialCap > 0) && " (Capped)"}
            </OEMScopeTag>
          )}
          
          {scope.correctiveMajor === true && (
            <OEMScopeTag color="#f5222d">
              Major
              {scope.correctiveMajorDetails && 
                [
                  scope.correctiveMajorDetails.tooling === true ? 'T' : '',
                  scope.correctiveMajorDetails.manpower === true ? 'M' : '',
                  scope.correctiveMajorDetails.parts === true ? 'P' : ''
                ].filter(Boolean).length > 0 && 
                ` (${[
                  scope.correctiveMajorDetails.tooling === true ? 'T' : '',
                  scope.correctiveMajorDetails.manpower === true ? 'M' : '',
                  scope.correctiveMajorDetails.parts === true ? 'P' : ''
                ].filter(Boolean).join('')})`
              }
              {(scope.majorEventCap > 0 || scope.majorFinancialCap > 0) && 
                (scope.correctiveMajorDetails && 
                  [
                    scope.correctiveMajorDetails.tooling === true ? 'T' : '',
                    scope.correctiveMajorDetails.manpower === true ? 'M' : '',
                    scope.correctiveMajorDetails.parts === true ? 'P' : ''
                  ].filter(Boolean).length > 0 ? 
                  " Capped" : " (Capped)")
              }
            </OEMScopeTag>
          )}
        </div>
      );
    }
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
            title="Are you sure you want to delete this OEM contract?"
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