// src/components/tables/inline/TableMetadata.jsx - Reusable metadata components for tables
import React from 'react';
import { Space, Typography, Statistic, Card, Row, Col } from 'antd';

const { Text } = Typography;

/**
 * Calculate statistics from time series data
 * @param {Array} timeSeries - Array of DataPointSchema objects
 * @returns {Object} Statistics object with min, max, avg, sum, count
 */
export const calculateRowStats = (timeSeries) => {
    if (!timeSeries || timeSeries.length === 0) {
        return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
    }
    
    const values = timeSeries
        .map(dp => parseFloat(dp.value))
        .filter(val => !isNaN(val));
    
    if (values.length === 0) {
        return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
    }
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { min, max, avg, sum, count: values.length };
};

/**
 * Format value based on field type
 * @param {number} value - Value to format
 * @param {string} fieldType - Field type ('currency', 'percentage', 'number')
 * @param {number} precision - Decimal precision
 * @returns {string} Formatted value
 */
export const formatValueByType = (value, fieldType, precision = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    
    const num = parseFloat(value);
    
    switch (fieldType) {
        case 'currency':
            return `$${num.toLocaleString(undefined, { 
                minimumFractionDigits: precision,
                maximumFractionDigits: precision 
            })}`;
        case 'percentage':
            return `${num.toLocaleString(undefined, { 
                minimumFractionDigits: precision,
                maximumFractionDigits: precision 
            })}%`;
        default:
            return num.toLocaleString(undefined, { 
                minimumFractionDigits: precision,
                maximumFractionDigits: precision 
            });
    }
};

/**
 * Compact metadata renderer for expandable rows
 * @param {Object} rowData - Row data object
 * @param {Object} stats - Calculated statistics
 * @param {Object} fieldConfig - Field configuration
 * @returns {JSX.Element} Compact metadata display
 */
export const CompactMetadataRenderer = ({ rowData, stats, fieldConfig }) => (
    <div style={{ 
        fontSize: '10px', 
        color: '#8c8c8c', 
        padding: '4px 8px',
        backgroundColor: '#fafafa',
        borderRadius: '4px'
    }}>
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
            <span>Min: {formatValueByType(stats.min, fieldConfig?.type)}</span>
            <span>Avg: {formatValueByType(stats.avg, fieldConfig?.type)}</span>
            <span>Max: {formatValueByType(stats.max, fieldConfig?.type)}</span>
            <span>Sum: {formatValueByType(stats.sum, fieldConfig?.type)}</span>
            <span>Count: {stats.count}</span>
        </Space>
    </div>
);

/**
 * Detailed metadata renderer with statistics cards
 * @param {Object} rowData - Row data object
 * @param {Object} stats - Calculated statistics
 * @param {Object} fieldConfig - Field configuration
 * @returns {JSX.Element} Detailed metadata display
 */
export const DetailedMetadataRenderer = ({ rowData, stats, fieldConfig }) => (
    <Card size="small" style={{ margin: '8px 0' }}>
        <Row gutter={16}>
            <Col span={4}>
                <Statistic
                    title="Minimum"
                    value={stats.min}
                    formatter={(value) => formatValueByType(value, fieldConfig?.type)}
                    valueStyle={{ fontSize: '12px' }}
                />
            </Col>
            <Col span={4}>
                <Statistic
                    title="Average"
                    value={stats.avg}
                    formatter={(value) => formatValueByType(value, fieldConfig?.type)}
                    valueStyle={{ fontSize: '12px' }}
                />
            </Col>
            <Col span={4}>
                <Statistic
                    title="Maximum"
                    value={stats.max}
                    formatter={(value) => formatValueByType(value, fieldConfig?.type)}
                    valueStyle={{ fontSize: '12px' }}
                />
            </Col>
            <Col span={4}>
                <Statistic
                    title="Total"
                    value={stats.sum}
                    formatter={(value) => formatValueByType(value, fieldConfig?.type)}
                    valueStyle={{ fontSize: '12px' }}
                />
            </Col>
            <Col span={4}>
                <Statistic
                    title="Data Points"
                    value={stats.count}
                    valueStyle={{ fontSize: '12px' }}
                />
            </Col>
            <Col span={4}>
                <Statistic
                    title="Coverage"
                    value={stats.count}
                    suffix={`/ ${rowData.years?.length || 0}`}
                    valueStyle={{ fontSize: '12px' }}
                />
            </Col>
        </Row>
    </Card>
);

/**
 * Table header metadata showing overall changes and validation status
 * @param {number} changeCount - Number of modified cells
 * @param {number} errorCount - Number of validation errors
 * @param {number} totalCells - Total number of editable cells
 * @param {boolean} isEditing - Whether table is in edit mode
 * @returns {JSX.Element} Header metadata display
 */
export const TableHeaderMetadata = ({ 
    changeCount = 0, 
    errorCount = 0, 
    totalCells = 0, 
    isEditing = false 
}) => {
    const changePercentage = totalCells > 0 ? Math.round((changeCount / totalCells) * 100) : 0;
    
    return (
        <Space size="small" style={{ fontSize: '11px' }}>
            {changeCount > 0 && (
                <span style={{ color: '#1890ff' }}>
                    {changeCount} changes ({changePercentage}% of cells)
                </span>
            )}
            {errorCount > 0 && (
                <span style={{ color: '#ff4d4f' }}>
                    {errorCount} validation errors
                </span>
            )}
            {isEditing && changeCount === 0 && errorCount === 0 && (
                <span style={{ color: '#8c8c8c' }}>
                    No changes yet
                </span>
            )}
        </Space>
    );
};

/**
 * Validation error summary with grouped error display
 * @param {Map} validationErrors - Map of validation errors by cell key
 * @param {boolean} saveAttempted - Whether save has been attempted
 * @param {Function} onClose - Close handler
 * @returns {JSX.Element|null} Validation summary or null
 */
export const ValidationErrorSummary = ({ 
    validationErrors = new Map(), 
    saveAttempted = false, 
    onClose 
}) => {
    if (!saveAttempted || validationErrors.size === 0) return null;
    
    // Group errors by type for better UX
    const errorsByType = new Map();
    validationErrors.forEach((error) => {
        const count = errorsByType.get(error) || 0;
        errorsByType.set(error, count + 1);
    });
    
    return (
        <div style={{
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Text strong style={{ color: '#ff4d4f', fontSize: '14px' }}>
                        Validation Errors
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                            Please fix the following errors before saving:
                        </Text>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
                            {Array.from(errorsByType.entries()).map(([error, count]) => (
                                <li key={error} style={{ fontSize: '12px', color: '#595959' }}>
                                    {error} ({count} cell{count > 1 ? 's' : ''})
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '16px',
                            color: '#8c8c8c',
                            cursor: 'pointer',
                            padding: '0',
                            lineHeight: '1'
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};