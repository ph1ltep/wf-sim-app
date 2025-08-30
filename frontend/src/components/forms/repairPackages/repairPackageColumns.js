// frontend/src/components/forms/repairPackages/repairPackageColumns.js
import React from 'react';
import { Space, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  StarOutlined,
  CloseCircleOutlined,
  GoldOutlined,
  TeamOutlined,
  CarOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { getMarketFactorColorScheme } from '../../../utils/charts/colors';

/**
 * Format currency with EUR symbol and commas
 */
const formatCurrency = (value) => {
  if (!value) return '€0';
  return `€${value.toLocaleString()}`;
};

/**
 * Format category display with solid color tags
 */
const getCategoryTag = (category) => {
  const categoryColors = {
    major: '#f50',
    medium: '#fa8c16', 
    minor: '#52c41a',
    electronic: '#1890ff',
    blade: '#722ed1'
  };
  
  const categoryLabels = {
    major: 'Major',
    medium: 'Medium',
    minor: 'Minor', 
    electronic: 'Electronic',
    blade: 'Blade'
  };

  return (
    <Tag color={categoryColors[category]} style={{ border: 'none' }}>
      {categoryLabels[category] || category}
    </Tag>
  );
};

/**
 * Calculate total per-event costs across all categories
 */
const calculateTotalPerEvent = (costs) => {
  if (!costs) return 0;
  const categories = ['material', 'labor', 'tooling', 'crane', 'other'];
  return categories.reduce((total, category) => {
    const categoryData = costs[category];
    return total + (categoryData?.perEventEUR || 0);
  }, 0);
};

/**
 * Calculate total per-day costs across all categories
 */
const calculateTotalPerDay = (costs) => {
  if (!costs) return 0;
  const categories = ['material', 'labor', 'tooling', 'crane', 'other'];
  return categories.reduce((total, category) => {
    const categoryData = costs[category];
    return total + (categoryData?.perDayEUR || 0);
  }, 0);
};

/**
 * Generate cost category icons showing which categories have values
 */
const getCostCategoryIcons = (costs) => {
  if (!costs) return null;

  const categoryConfig = {
    material: { icon: <GoldOutlined />, color: getMarketFactorColorScheme('material'), label: 'Material' },
    labor: { icon: <TeamOutlined />, color: getMarketFactorColorScheme('labor'), label: 'Labor' },
    tooling: { icon: <ToolOutlined />, color: getMarketFactorColorScheme('tooling'), label: 'Tooling' },
    crane: { icon: <CarOutlined />, color: getMarketFactorColorScheme('crane'), label: 'Crane' },
    other: { icon: <MoreOutlined />, color: getMarketFactorColorScheme('other'), label: 'Other' }
  };

  return (
    <Space size={2}>
      {Object.entries(categoryConfig).map(([key, config]) => {
        const categoryData = costs[key];
        const hasValue = (categoryData?.perEventEUR > 0) || (categoryData?.perDayEUR > 0);
        return (
          <Tooltip key={key} title={`${config.label}: ${hasValue ? 'Has costs' : 'No costs'}`}>
            <span style={{ 
              color: hasValue ? config.color : '#d9d9d9',
              fontSize: '12px'
            }}>
              {config.icon}
            </span>
          </Tooltip>
        );
      })}
    </Space>
  );
};

/**
 * Generate status icons for toggles
 */
const getStatusIcons = (record) => {
  const hasCrane = (record.costs?.crane?.perEventEUR > 0) || (record.costs?.crane?.perDayEUR > 0);
  
  return (
    <Space size={4}>
      {/* Crane Status */}
      <Tooltip title={hasCrane ? 'Crane Required' : 'No Crane'}>
        <span style={{ color: hasCrane ? '#722ed1' : '#d9d9d9', fontSize: '12px' }}>
          <CarOutlined />
        </span>
      </Tooltip>
      
      {/* Default Status */}
      <Tooltip title={record.isDefault ? 'Default Package' : 'Not Default'}>
        <span style={{ color: record.isDefault ? '#faad14' : '#d9d9d9', fontSize: '12px' }}>
          <StarOutlined />
        </span>
      </Tooltip>
      
      {/* Active Status */}
      <Tooltip title={record.isActive ? 'Active' : 'Inactive'}>
        <span style={{ color: record.isActive ? '#52c41a' : '#f50', fontSize: '12px' }}>
          {record.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        </span>
      </Tooltip>
    </Space>
  );
};

/**
 * Generate table columns for repair packages
 * @param {Function} handleEdit - Function to handle edit action
 * @param {Function} handleDelete - Function to handle delete action
 * @param {Function} handleClone - Function to handle clone action
 * @returns {Array} Array of column definitions
 */
export const getRepairPackageColumns = (handleEdit, handleDelete, handleClone) => [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
    width: '20%',
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    render: (category) => getCategoryTag(category),
    filters: [
      { text: 'Major', value: 'major' },
      { text: 'Medium', value: 'medium' },
      { text: 'Minor', value: 'minor' },
      { text: 'Electronic', value: 'electronic' },
      { text: 'Blade', value: 'blade' }
    ],
    onFilter: (value, record) => record.category === value,
    width: '12%',
  },
  {
    title: 'Status',
    key: 'statusIcons',
    render: (_, record) => getStatusIcons(record),
    width: '8%',
  },
  {
    title: 'Cost Categories',
    key: 'costCategories',
    render: (_, record) => getCostCategoryIcons(record.costs),
    width: '12%',
  },
  {
    title: 'Total Per-Event',
    key: 'totalPerEvent',
    render: (_, record) => formatCurrency(calculateTotalPerEvent(record.costs)),
    sorter: (a, b) => calculateTotalPerEvent(a.costs) - calculateTotalPerEvent(b.costs),
    width: '12%',
  },
  {
    title: 'Total Per-Day',
    key: 'totalPerDay',
    render: (_, record) => formatCurrency(calculateTotalPerDay(record.costs)),
    sorter: (a, b) => calculateTotalPerDay(a.costs) - calculateTotalPerDay(b.costs),
    width: '12%',
  },
  {
    title: 'Duration',
    dataIndex: 'baseDurationDays',
    key: 'duration',
    render: (days) => `${days || 1} day${(days || 1) !== 1 ? 's' : ''}`,
    sorter: (a, b) => (a.baseDurationDays || 1) - (b.baseDurationDays || 1),
    width: '8%',
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
        <Button
          icon={<CopyOutlined />}
          type="text"
          onClick={() => handleClone(record)}
        >
          Clone
        </Button>
        <Popconfirm
          title="Are you sure you want to delete this repair package?"
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
    ),
    width: '16%',
  }
];