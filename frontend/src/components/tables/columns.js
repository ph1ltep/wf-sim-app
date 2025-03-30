// src/components/tables/columns.js
import React from 'react';
import { Button, Tooltip, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Create a actions column with edit/delete buttons
 */
export const createActionsColumn = (handleEdit, handleDelete, options = {}) => {
  const {
    title = 'Actions',
    key = 'actions',
    width = 120,
    align = 'center',
    hideEdit = false,
    hideDelete = false,
    needsConfirm = true,
    confirmTitle = 'Are you sure you want to delete this item?'
  } = options;
  
  return {
    title,
    key,
    width,
    align,
    render: (_, record) => (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
        {!hideEdit && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        )}
        
        {!hideDelete && (
          needsConfirm ? (
            <Popconfirm
              title={confirmTitle}
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          ) : (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          )
        )}
      </div>
    )
  };
};

/**
 * Create a basic text column
 */
export const createTextColumn = (dataIndex, title, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    render,
    ellipsis = false,
    align = 'left',
    sorter = false
  } = options;
  
  return {
    title: tooltip ? (
      <span>
        {title}
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ) : title,
    dataIndex,
    key,
    width,
    ellipsis,
    align,
    render,
    sorter: sorter === true ? 
      (a, b) => {
        if (typeof a[dataIndex] === 'string') {
          return a[dataIndex].localeCompare(b[dataIndex]);
        }
        return a[dataIndex] - b[dataIndex];
      } : 
      sorter
  };
};

/**
 * Create a numeric column
 */
export const createNumberColumn = (dataIndex, title, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    precision = 0,
    prefix = '',
    suffix = '',
    render,
    align = 'right',
    sorter = true
  } = options;
  
  return {
    title: tooltip ? (
      <span>
        {title}
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ) : title,
    dataIndex,
    key,
    width,
    align,
    render: render || ((value) => {
      if (value === undefined || value === null) {
        return '-';
      }
      
      const formattedValue = typeof value === 'number' ? 
        value.toLocaleString(undefined, {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }) : 
        value;
      
      return `${prefix}${formattedValue}${suffix}`;
    }),
    sorter: sorter ? (a, b) => a[dataIndex] - b[dataIndex] : false
  };
};

/**
 * Create a tag column
 */
export const createTagColumn = (dataIndex, title, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    render,
    colorMap = {},
    defaultColor = 'default'
  } = options;
  
  return {
    title: tooltip ? (
      <span>
        {title}
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ) : title,
    dataIndex,
    key,
    width,
    render: render || ((value) => {
      const color = colorMap[value] || defaultColor;
      return <Tag color={color}>{value}</Tag>;
    })
  };
};