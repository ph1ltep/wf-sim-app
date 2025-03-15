// src/components/config/locations/locationColumns.js
import React from 'react';
import { Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * Generate table columns for location data
 * @param {Function} handleEdit - Function to handle edit action
 * @param {Function} handleDelete - Function to handle delete action
 * @returns {Array} Array of column definitions
 */
export const getLocationColumns = (handleEdit, handleDelete) => [
  {
    title: 'Country',
    dataIndex: 'country',
    key: 'country',
    sorter: (a, b) => a.country.localeCompare(b.country),
  },
  {
    title: 'Country Code',
    dataIndex: 'countryCode',
    key: 'countryCode',
  },
  {
    title: 'Inflation Rate (%)',
    dataIndex: 'inflationRate',
    key: 'inflationRate',
    render: value => `${value}%`,
  },
  {
    title: 'Capacity Factor (%)',
    dataIndex: 'capacityFactor',
    key: 'capacityFactor',
    render: value => `${value}%`,
  },
  {
    title: 'Energy Price',
    dataIndex: 'energyPrice',
    key: 'energyPrice',
    render: (value, record) => `${value} ${record.currency}/MWh`,
  },
  {
    title: 'Local Currency',
    dataIndex: 'currency',
    key: 'currency',
  },
  {
    title: 'Foreign Currency',
    dataIndex: 'foreignCurrency',
    key: 'foreignCurrency',
  },
  {
    title: 'Foreign/Local FX',
    dataIndex: 'exchangeRate',
    key: 'exchangeRate',
    render: (value, record) => `1 ${record.foreignCurrency} = ${value} ${record.currency}`,
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
            title="Are you sure you want to delete this location?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} type="text" danger />
          </Popconfirm>
        </Space>
      );
    },
  },
];