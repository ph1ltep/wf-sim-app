// src/components/tables/columns.js
import React from 'react';
import { Button, Tooltip, Popconfirm, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Create a actions column with edit/delete buttons
 * @param {Function} handleEdit Function to handle edit action
 * @param {Function} handleDelete Function to handle delete action
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
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
        {!hideEdit && handleEdit && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        )}

        {!hideDelete && handleDelete && (
          needsConfirm ? (
            <Popconfirm
              title={confirmTitle}
              onConfirm={() => handleDelete(record.id || record._id || record.key)}
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
              onClick={() => handleDelete(record.id || record._id || record.key)}
            />
          )
        )}
      </div>
    )
  };
};

/**
 * Create a basic text column
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
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
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
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
 * Create a percentage column
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createPercentageColumn = (dataIndex, title, options = {}) => {
  return createNumberColumn(dataIndex, title, {
    precision: 1,
    suffix: '%',
    ...options
  });
};

/**
 * Create a currency column
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createCurrencyColumn = (dataIndex, title, options = {}) => {
  const {
    currency = '$',
    currencyPosition = 'prefix',
    ...restOptions
  } = options;

  return createNumberColumn(dataIndex, title, {
    precision: 2,
    prefix: currencyPosition === 'prefix' ? currency : '',
    suffix: currencyPosition === 'suffix' ? ` ${currency}` : '',
    ...restOptions
  });
};

/**
 * Create a tag column
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
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
      if (value === undefined || value === null) return null;

      // Handle array of tags
      if (Array.isArray(value)) {
        return (
          <Space size={[0, 4]} wrap>
            {value.map((tag, index) => {
              const tagValue = typeof tag === 'object' ? tag.name || tag.value || tag.label : tag;
              const tagColor = typeof tag === 'object' && tag.color ?
                tag.color :
                colorMap[tagValue] || defaultColor;

              return (
                <Tag color={tagColor} key={index}>
                  {tagValue}
                </Tag>
              );
            })}
          </Space>
        );
      }

      // Handle single tag
      const color = colorMap[value] || defaultColor;
      return <Tag color={color}>{value}</Tag>;
    })
  };
};

/**
 * Create a multi-tag column with custom tag components
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Function} tagRenderer Function that renders a custom tag
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createCustomTagsColumn = (dataIndex, title, tagRenderer, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    getTagsFromRecord,
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
    render: (_, record) => {
      const tags = getTagsFromRecord ? getTagsFromRecord(record) : record[dataIndex] || [];

      if (!tags || tags.length === 0) return null;

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {tags.map((tag, index) => tagRenderer(tag, index, record))}
        </div>
      );
    }
  };
};

/**
 * Create a boolean column with Yes/No values
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createBooleanColumn = (dataIndex, title, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    trueText = 'Yes',
    falseText = 'No',
    trueColor = 'success',
    falseColor = 'default',
    ...restOptions
  } = options;

  return createTagColumn(dataIndex, title, {
    key,
    width,
    tooltip,
    colorMap: {
      [true]: trueColor,
      [false]: falseColor,
      'true': trueColor,
      'false': falseColor,
    },
    render: (value) => {
      const boolValue = value === true || value === 'true';
      return (
        <Tag color={boolValue ? trueColor : falseColor}>
          {boolValue ? trueText : falseText}
        </Tag>
      );
    },
    ...restOptions
  });
};

/**
 * Create a date column
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createDateColumn = (dataIndex, title, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    format = 'YYYY-MM-DD',
    render,
    ...restOptions
  } = options;

  return createTextColumn(dataIndex, title, {
    key,
    width,
    tooltip,
    render: render || ((value) => {
      if (!value) return '-';

      // Use a date formatting library here if available
      // For now, just return the value or a simple format
      try {
        if (typeof value === 'string') {
          const date = new Date(value);
          return date.toLocaleDateString();
        }
        return value;
      } catch (e) {
        return value;
      }
    }),
    ...restOptions
  });
};

/**
 * Create a percentile column with P-prefix formatting
 * @param {string} dataIndex Field name in the data source
 * @param {string} title Column title
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createPercentileColumn = (dataIndex, title, options = {}) => {
  const {
    key = dataIndex,
    width,
    tooltip,
    align = 'center',
    ...restOptions
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
    render: value => `P${value}`,
    ...restOptions
  };
};

/**
 * Create a nested property column
 * @param {string[]} path Path to the property in the record
 * @param {string} title Column title
 * @param {Function} columnCreator Function to create the column
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 */
export const createNestedColumn = (path, title, columnCreator = createTextColumn, options = {}) => {
  const dataIndex = path[0];
  const key = path.join('.');

  const baseColumn = columnCreator(dataIndex, title, {
    key,
    ...options
  });

  // Override render function to handle nested property
  return {
    ...baseColumn,
    render: (value, record) => {
      let currentValue = record;
      for (const segment of path) {
        if (currentValue === undefined || currentValue === null) return null;
        currentValue = currentValue[segment];
      }

      // Use the original render function with the resolved value
      if (baseColumn.render) {
        return baseColumn.render(currentValue, record);
      }

      return currentValue;
    }
  };
};

/**
 * Create a column that displays multiple icons with tooltips based on record properties
 * @param {string} title Column title
 * @param {Array} iconConfigs Array of icon configurations
 * @param {Object} options Configuration options
 * @returns {Object} Column definition
 * 
 * Each icon config should have:
 * - key: property path or function to determine whether to show the icon
 * - icon: React element (Ant Design icon)
 * - tooltip: Text or function to generate tooltip content
 * - color: (optional) Color for the icon
 */
export const createIconColumn = (title, iconConfigs = [], options = {}) => {
  const {
    key = 'icons',
    width = 80,
    align = 'center',
    tooltipPlacement = 'top',
  } = options;

  return {
    title,
    key,
    width,
    align,
    render: (_, record) => {
      // Filter icons to display based on record properties
      const iconsToDisplay = iconConfigs.filter(config => {
        if (typeof config.key === 'function') {
          return config.key(record);
        }
        
        // Handle nested paths with dot notation
        if (typeof config.key === 'string' && config.key.includes('.')) {
          const parts = config.key.split('.');
          let value = record;
          for (const part of parts) {
            if (value === undefined || value === null) return false;
            value = value[part];
          }
          return Boolean(value);
        }
        
        return Boolean(record[config.key]);
      });
      
      if (iconsToDisplay.length === 0) {
        return null;
      }
      
      return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {iconsToDisplay.map((config, index) => {
            // Generate tooltip content
            const tooltipContent = typeof config.tooltip === 'function' 
              ? config.tooltip(record) 
              : config.tooltip;
            
            // Clone the icon with color prop if specified
            const icon = config.color 
              ? React.cloneElement(config.icon, { style: { color: config.color } }) 
              : config.icon;
            
            return (
              <Tooltip 
                key={index} 
                title={tooltipContent}
                placement={tooltipPlacement}
              >
                <span className="icon-column-item">
                  {icon}
                </span>
              </Tooltip>
            );
          })}
        </div>
      );
    }
  };
};

export const locationColumns = (handleEdit, handleDelete) => [
  createTextColumn('country', 'Country', {
    sorter: true,
  }),
  createTextColumn('countryCode', 'Country Code'),
  createPercentageColumn('inflationRate', 'Inflation Rate'),
  createPercentageColumn('capacityFactor', 'Capacity Factor'),
  createNumberColumn('energyPrice', 'Energy Price', {
    render: (value, record) => `${value} ${record.currency}/MWh`,
  }),
  createTextColumn('currency', 'Local Currency'),
  createTextColumn('foreignCurrency', 'Foreign Currency'),
  createTextColumn('exchangeRate', 'Foreign/Local FX', {
    render: (value, record) => `1 ${record.foreignCurrency} = ${value} ${record.currency}`,
  }),
];

export const oemScopeColumns = (tagRenderer) => [
  createTextColumn('name', 'Name', {
    sorter: true,
  }),
  createCustomTagsColumn('scope', 'Scope', tagRenderer, {
    getTagsFromRecord: (record) => {
      // This function would need to generate tags from the record
      // Similar to the renderScopeTags function from oemScopeUtils
      return record.tags || [];
    }
  }),
];