// src/components/config/oemContracts/oemContractColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import OEMScopeTag from '../../config/oemScopes/OEMScopeTag';
import { formatCurrency, getTagTooltip, renderScopeTags } from '../../../utils/oemScopeUtils';

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
      
      const tags = renderScopeTags(scope, OEMScopeTag);
      
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {tags.map(tag => (
            <Tooltip key={tag.id} title={getTagTooltip(tag.tag, scope)} placement="top">
              <div>
                <OEMScopeTag color={tag.color}>{tag.content}</OEMScopeTag>
              </div>
            </Tooltip>
          ))}
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