// frontend/src/components/forms/OMScopes/oemScopeColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import OEMScopeTag from './OEMScopeTag';
import { getTagTooltip, renderScopeTags } from 'utils/oemScopeUtils';

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
    render: (_, record) => {
      const tags = renderScopeTags(record, OEMScopeTag);

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {tags.map(tag => (
            <Tooltip key={tag.id} title={getTagTooltip(tag.tag, record)} placement="top">
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