// src/components/distributionFields/renderTimeSeriesFields.js
import React from 'react';
import {
    Button,
    Alert,
    Space,
    Divider,
    Typography,
    Popconfirm,
    Tooltip
} from 'antd';
import { LineChartOutlined, LoadingOutlined, FileTextOutlined, FundOutlined } from '@ant-design/icons';
import { TimeSeriesTable } from '../tables';
import { formatNumber } from '../../utils/formatUtils';

const { Text } = Typography;

/**
 * Renders the time series mode UI for distribution fields
 *
 * @param {string} distributionType - Type of distribution
 * @param {Array} parametersPath - Path to the parameters object in context
 * @param {Array} timeSeriesParametersPath - Path to the timeSeriesParameters object in context
 * @param {Object} options - Additional options
 * @param {string} options.addonAfter - Text to display after value inputs
 * @param {string} options.valueType - Type of value (number, percentage, currency)
 * @param {number} options.precision - Decimal precision for value display
 * @param {string} options.valueName - Display name for the value field
 * @param {Array} options.timeSeriesData - Current time series data points
 * @param {boolean} options.isFitting - Whether fitting operation is in progress
 * @param {Function} options.onFitDistribution - Callback when fit button is clicked
 * @param {Function} options.onClearFit - Callback when clear fit button is clicked
 * @param {boolean} options.hasFittedParams - Whether fitted parameters exist
 * @param {Object} options.metadata - Distribution metadata from getMetadata()
 * @param {Object} options.parameters - Current distribution parameters
 * @param {number} options.minRequiredPoints - Minimum points required for fitting
 * @returns {React.ReactNode} Time series UI components
 */
const renderTimeSeriesFields = (
    distributionType,
    parametersPath,
    timeSeriesParametersPath,
    options = {}
) => {
    const {
        addonAfter = '',
        valueType = 'number',
        precision = 2,
        valueName = 'Value',
        timeSeriesData = [],
        isFitting = false,
        onFitDistribution,
        onClearFit,
        hasFittedParams = false,
        metadata = {},
        parameters = {},
        minRequiredPoints = 3
    } = options;

    const hasEnoughData = timeSeriesData && Array.isArray(timeSeriesData) && timeSeriesData.length >= minRequiredPoints;

    return (
        <div className="time-series-fields">
            {/* Data Table */}
            <TimeSeriesTable
                path={[...timeSeriesParametersPath, 'value']}
                valueLabel={valueName}
                valueType={valueType}
                precision={precision}
                addonAfter={addonAfter}
                disableEditing={isFitting}
                minRequiredPoints={minRequiredPoints}
            />

            <Divider style={{ margin: '12px 0' }} />

            {/* Compatibility and Fit Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    {/* Left column empty - removed compatibility alerts and application notes */}
                </div>

                <Space>
                    {hasFittedParams && (
                        <Popconfirm
                            title="Clear fitted parameters?"
                            description="This will revert to manual parameter entry."
                            onConfirm={onClearFit}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button size="small">
                                Clear Fit
                            </Button>
                        </Popconfirm>
                    )}

                    <Tooltip title={!hasEnoughData ? `Need at least ${minRequiredPoints} data points` : ''}>
                        <Button
                            type="primary"
                            size="small"
                            icon={isFitting ? <LoadingOutlined /> : <LineChartOutlined />}
                            onClick={onFitDistribution}
                            disabled={!hasEnoughData || isFitting}
                            loading={isFitting}
                        >
                            Fit Distribution
                        </Button>
                    </Tooltip>
                </Space>
            </div>

            {/* Fitted Parameters Display */}
            {hasFittedParams && (
                <Alert
                    message="Distribution parameters have been fitted to your data"
                    description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Fitted Parameters:</Text>
                                <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                                    {/* Display all parameters from the parameters object */}
                                    {Object.entries(parameters)
                                        .filter(([key, value]) => {
                                            // Only show parameters that are defined for this distribution
                                            return metadata.parameters?.some(p => p.name === key);
                                        })
                                        .map(([key, value]) => {
                                            // Get parameter display name from metadata if available
                                            const paramMeta = metadata.parameters?.find(p => p.name === key);
                                            const displayName = paramMeta ?
                                                (paramMeta.fieldProps.label || paramMeta.name) : key;

                                            // Format the value appropriately
                                            const formattedValue = typeof value === 'number' ?
                                                value.toFixed(String(paramMeta.fieldProps.step).length - 1) : (value === null ? 'null' : String(value));

                                            // Display description if available
                                            const description = paramMeta?.description ?
                                                ` - ${paramMeta.description}` : '';

                                            return (
                                                <li key={key}>
                                                    <Text code>{displayName}</Text>: {formattedValue}{description}
                                                </li>
                                            );
                                        })}
                                </ul>
                            </div>

                            <div>
                                <Text strong>Time Series Data:</Text> {timeSeriesData.length} points used for fitting
                            </div>
                        </Space>
                    }
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            )}
        </div>
    );
};

export default renderTimeSeriesFields;