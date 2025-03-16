// src/components/modules/Contracts/contractColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * Format currency to display with $ sign and commas
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (value) => {
  if (!value) return '$0';
  return `$${value.toLocaleString()}`;
};

/**
 * Format years array to display as a range or list
 * @param {Array<number>} years - Array of years
 * @returns {string} Formatted years text
 */
const formatYears = (years) => {
  if (!years || !Array.isArray(years) || years.length === 0) {
    return 'No years specified';
  }
  
  // Sort years
  const sortedYears = [...years].sort((a, b) => a - b);
  
  // Check if years are consecutive
  const isConsecutive = sortedYears.every((year, index) => 
    index === 0 || year === sortedYears[index - 1] + 1
  );
  
  if (isConsecutive && sortedYears.length > 2) {
    return `Years ${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]}`;
  }
  
  // For non-consecutive or short lists, return comma-separated list
  return `Years: ${sortedYears.join(', ')}`;
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
    sorter: (a, b) => a.name.localeString ? a.name.localeCompare(b.name) : 0,
  },
  {
    title: 'Term',
    key: 'years',
    render: (_, record) => formatYears(record.years),
    sorter: (a, b) => {
      if (!a.years || !b.years) return 0;
      const minA = Math.min(...a.years);
      const minB = Math.min(...b.years);
      return minA - minB;
    },
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
    dataIndex: 'oemScopeName',
    key: 'oemScope',
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space size="small">
        <Button 
          icon={<EditOutlined />} 
          type="text" 
          onClick={() => handleEdit(record)}
        />
        <Popconfirm
          title="Are you sure you want to delete this OEM contract?"
          onConfirm={() => handleDelete(record.id)}
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
    ),
  },
];