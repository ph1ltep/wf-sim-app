// src/components/distributionFields/renderTimeSeriesFields.js
import React, { useState } from 'react';
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
 * @param {Object} options - Additional options
 * @param {string} options.addonAfter - Text to display after value inputs
 * @param {string} options.valueType - Type of value (number, percentage, currency)
 * @param {number} options.precision - Decimal precision for value display
 * @param {string} options.valueName - Display name for the value field
 * @param {Object} options.timeSeriesData - Current time series data points
 * @param {boolean} options.isFitting - Whether fitting operation is in progress
 * @param {Function} options.onFitDistribution - Callback when fit button is clicked
 * @param {Function} options.onClearFit - Callback when clear fit button is clicked
 * @param {boolean} options.hasFittedParams - Whether fitted parameters exist
 * @param {Object} options.metadata - Distribution metadata from getMetadata()
 * @returns {React.ReactNode} Time series UI components
 */
const renderTimeSeriesFields = (
    distributionType,
    parametersPath,
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
        metadata = {}
    } = options;

    // Get the minimum required data points based on distribution type
    const getMinRequiredPoints = () => {
        switch (distributionType) {
            case 'normal':
            case 'lognormal':
                return 5;
            case 'weibull':
            case 'gamma':
                return 6;
            case 'triangular':
                return 3;
            case 'uniform':
                return 2;
            case 'exponential':
                return 4;
            case 'gbm':
                return 8; // Time series data needs more points for GBM
            default:
                return 3;
        }
    };

    const minRequiredPoints = getMinRequiredPoints();
    const hasEnoughData = timeSeriesData && Array.isArray(timeSeriesData) && timeSeriesData.length >= minRequiredPoints;

    // Calculate a compatibility score for data with selected distribution
    const getCompatibilityMessage = () => {
        if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
            return null;
        }

        // Simple compatibility checks based on distribution type and data patterns
        if (distributionType === 'lognormal' || distributionType === 'exponential' || distributionType === 'weibull') {
            // Check if any values are <= 0, which is incompatible with these distributions
            const hasNegativeOrZero = timeSeriesData.some(point => {
                return point && typeof point === 'object' && point.value !== undefined && point.value <= 0;
            });
            if (hasNegativeOrZero) {
                return {
                    type: 'warning',
                    message: `${distributionType} distribution requires all values to be positive`
                };
            }
        }

        if (distributionType === 'normal') {
            // For normal distribution, check if data is relatively symmetric
            // This is a simplified check - real implementation would use skewness calculation
            if (Array.isArray(timeSeriesData) && timeSeriesData.length > 0) {
                const values = timeSeriesData
                    .filter(point => point && typeof point === 'object' && point.value !== undefined)
                    .map(point => point.value);

                if (values.length > 2) { // Need at least 3 values for meaningful symmetry check
                    const sum = values.reduce((acc, val) => acc + val, 0);
                    const mean = sum / values.length;
                    const sortedValues = [...values].sort((a, b) => a - b);
                    const median = sortedValues[Math.floor(values.length / 2)];

                    const meanMedianDiff = Math.abs(mean - median) / mean;
                    if (meanMedianDiff > 0.3) {
                        return {
                            type: 'info',
                            message: 'Data appears skewed. Consider using lognormal or weibull distribution instead.'
                        };
                    }
                }
            }
        }

        return {
            type: 'success',
            message: `Data compatible with ${distributionType} distribution`
        };
    };

    const compatibility = getCompatibilityMessage();

    return (
        <div className="time-series-fields">
            {/* Data Table */}
            <TimeSeriesTable
                path={[...parametersPath, 'value']}
                valueLabel={valueName}
                valueType={valueType}
                precision={precision}
                addonAfter={addonAfter}
                disableEditing={isFitting}
            />

            <Divider style={{ margin: '12px 0' }} />

            {/* Compatibility and Fit Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space direction="vertical" style={{ flex: 1 }}>
                    {!hasEnoughData ? (
                        <Alert
                            message={`Need at least ${minRequiredPoints} data points`}
                            type="info"
                            showIcon
                            icon={<FileTextOutlined />}
                        />
                    ) : compatibility ? (
                        <Alert
                            message={compatibility.message}
                            type={compatibility.type}
                            showIcon
                        />
                    ) : null}

                    {metadata && metadata.applications && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <FundOutlined /> Best for: {metadata.applications}
                        </Text>
                    )}
                </Space>

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
                            <Text>Parameters were automatically calculated based on your time series data.</Text>
                            <Text type="secondary">You can still view and modify the distribution plot using the fitted parameters.</Text>
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