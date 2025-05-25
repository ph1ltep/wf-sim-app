// src/components/config/locations/locationColumns.js
import React from 'react';
import { Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, BankOutlined, LineChartOutlined, PieChartOutlined, FileTextOutlined, RiseOutlined } from '@ant-design/icons';
import { createIconColumn } from '../../tables/columns';

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
    title: 'Capacity Factor (%)',
    dataIndex: 'capacityFactor',
    key: 'capacityFactor',
    render: value => `${value}%`,
  },
  {
    title: 'Energy Price (MWh)',
    dataIndex: 'energyPrice',
    key: 'energyPrice',
    render: (value, record) => `${value.toLocaleString()} ${record.currency}`,
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
    title: 'ForEx Rate',
    dataIndex: 'exchangeRate',
    key: 'exchangeRate',
    render: (value, record) => `1 ${record.foreignCurrency} = ${value} ${record.currency}`,
  },
  createIconColumn('Financial Parameters', [
    {
      key: 'inflationRate',
      icon: <RiseOutlined />,
      tooltip: (record) => `Inflation Rate: ${record.inflationRate}%`,
      color: '#f5222d'
    },
    {
      key: 'costOfConstructionDebt',
      icon: <BankOutlined />,
      tooltip: (record) => `Construction Debt: ${record.costOfConstructionDebt}%`,
      color: '#1890ff'
    },
    {
      key: 'costOfOperationalDebt',
      icon: <BankOutlined />,
      tooltip: (record) => `Operational Debt: ${record.costOfOperationalDebt}%`,
      color: '#52c41a'
    },
    {
      key: 'costofEquity',
      icon: <LineChartOutlined />,
      tooltip: (record) => `Cost of Equity: ${record.costofEquity}%`,
      color: '#fa8c16'
    },
    {
      key: 'debtRatio',
      icon: <PieChartOutlined />,
      tooltip: (record) => `Debt Ratio: ${record.debtRatio}%`,
      color: '#722ed1'
    },
    {
      key: 'effectiveTaxRate',
      icon: <FileTextOutlined />,
      tooltip: (record) => `Tax Rate: ${record.effectiveTaxRate}%`,
      color: '#eb2f96'
    }
  ], {
    width: 180
  }),
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