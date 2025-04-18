// src/components/cards/DistributionCard.jsx - Modified version
import React, { useState, useMemo } from 'react';
import { Card, Space, Typography, Divider, Empty, Row, Col, Tooltip, Badge, Alert, Table, Button } from 'antd';
import { InfoCircleOutlined, ClockCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { hexToRgb, determineDecimalPrecision } from '../../utils/plotUtils';
import { generateTableData, prepareSummaryData, preparePercentileChartData } from '../../utils/plotDataUtils';

const { Text } = Typography;

/**
 * Reusable Distribution Card component for displaying distribution analysis charts
 * 
 * @param {Object} props Component props
 * @param {Object} props.simulationInfo SimulationInfoSchema object containing simulation results
 * @param {number} props.primaryPercentile Primary percentile value (e.g., 50 for P50)
 * @param {string} props.title Optional title override (defaults to distribution type name)
 * @param {React.ReactNode} props.icon Optional icon
 * @param {string} props.units Units to display (e.g., "MWh", "$")
 * @param {string} props.color Base color for the chart
 * @param {Object} props.cardProps Additional props for Card component
 * @param {number} props.height Chart height
 * @param {Object} props.extraLayoutOptions Additional Plotly layout options
 * @param {boolean} props.showMetadata Whether to show simulation metadata
 * @param {number} props.precision Number of decimal places to show (null for auto-detection)
 */
const DistributionCard = ({
    simulationInfo,
    primaryPercentile = 50,
    title,
    icon,
    units = '',
    color = '#1890ff',
    cardProps = {},
    height = 300,
    extraLayoutOptions = {},
    showMetadata = true,
    precision = null
}) => {
    // UI state
    const [dataTableVisible, setDataTableVisible] = useState(false);

    // Safely extract data from simulationInfo (handle null/undefined)
    const distribution = simulationInfo?.distribution || {};
    const iterations = simulationInfo?.iterations || 0;
    const seed = simulationInfo?.seed || 0;
    const years = simulationInfo?.years || 0;
    const timeElapsed = simulationInfo?.timeElapsed || 0;
    const results = simulationInfo?.results || [];
    const errors = simulationInfo?.errors || [];

    // Check for simulation errors
    const hasErrors = errors && errors.length > 0;
    const hasResults = results && results.length > 0;

    // Determine precision for numerical display (memoized)
    const actualPrecision = useMemo(() => {
        return precision !== null ? precision : determineDecimalPrecision(results);
    }, [results, precision]);

    // Prepare table data (memoized)
    const { columns, data: tableData } = useMemo(() => {
        if (!hasResults) return { columns: [], data: [] };
        return generateTableData(results, primaryPercentile, color, actualPrecision);
    }, [results, primaryPercentile, color, actualPrecision, hasResults]);

    // Prepare chart data (memoized)
    const { data, layout, config } = useMemo(() => {
        if (hasErrors || !hasResults) return { data: [], layout: {}, config: {} };
        return preparePercentileChartData(results, primaryPercentile, color, actualPrecision);
    }, [hasErrors, results, primaryPercentile, color, actualPrecision, hasResults]);

    // Prepare summary data (memoized)
    const summaryData = useMemo(() => {
        if (!hasResults) return [];
        return prepareSummaryData(results, primaryPercentile, actualPrecision);
    }, [results, primaryPercentile, actualPrecision, hasResults]);

    // Customize layout with provided options
    const customizedLayout = useMemo(() => {
        return {
            ...layout,
            height: height,
            yaxis: {
                ...(layout.yaxis || {}),
                title: units,
                hoverformat: `.${actualPrecision}f`,
            },
            // Adjust margins to make room for summary column
            margin: {
                ...(layout.margin || {}),
                r: 80, // Add right margin for summary column
            },
            ...extraLayoutOptions
        };
    }, [layout, height, units, actualPrecision, extraLayoutOptions]);

    // Use the provided title or get it from the distribution
    const cardTitle = useMemo(() => {
        return title || (distribution?.type
            ? `${distribution.type.charAt(0).toUpperCase() + distribution.type.slice(1)} Distribution`
            : "Distribution Analysis");
    }, [title, distribution]);

    // Create extra content for card title to show distribution type
    const titleContent = useMemo(() => {
        return (
            <Space>
                {icon}
                {cardTitle}
                {distribution?.type && !title && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        (Parameters: {Object.entries(distribution.parameters || {})
                            .filter(([key]) => key !== 'timeSeriesMode')
                            .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(actualPrecision) : value}`)
                            .join(', ')})
                    </Text>
                )}
            </Space>
        );
    }, [cardTitle, icon, distribution, title, actualPrecision]);

    // Card extra content with metadata
    const cardExtra = useMemo(() => {
        if (!showMetadata || !simulationInfo) return null;

        return (
            <Tooltip title={`${iterations.toLocaleString()} iterations, ${timeElapsed.toFixed(2)}ms execution time`}>
                <Space>
                    <Badge count={hasErrors ? errors.length : 0} color="red" size="small">
                        <InfoCircleOutlined style={{ fontSize: '16px', cursor: 'pointer' }} />
                    </Badge>
                    <ClockCircleOutlined style={{ fontSize: '16px' }} />
                    {timeElapsed.toFixed(0)}ms
                </Space>
            </Tooltip>
        );
    }, [showMetadata, iterations, timeElapsed, hasErrors, errors, simulationInfo]);

    // Early return if no simulation info
    if (!simulationInfo) {
        return (
            <Card
                title={title || "Distribution Analysis"}
                bordered={true}
                {...cardProps}
            >
                <Empty description="No simulation data available" />
            </Card>
        );
    }

    return (
        <Card
            title={titleContent}
            bordered={true}
            extra={cardExtra}
            {...cardProps}
        >
            {hasErrors ? (
                <Alert
                    message={`Simulation Error${errors.length > 1 ? 's' : ''}`}
                    description={
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {errors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                    }
                    type="error"
                    showIcon
                />
            ) : hasResults ? (
                <>
                    <div style={{ display: 'flex', position: 'relative' }}>
                        {/* Main chart */}
                        <div style={{ flex: 1 }}>
                            <Plot
                                data={data}
                                layout={customizedLayout}
                                config={config}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Summary column - positioned absolute to overlay on the right */}
                        <div style={{
                            position: 'absolute',
                            right: 10,
                            top: 40,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            background: 'rgba(255,255,255,0.85)',
                            padding: '8px 6px',
                            borderRadius: '4px',
                            boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                        }}>
                            {summaryData.map(summary => (
                                <div key={summary.percentile} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px 4px',
                                    backgroundColor: summary.isPrimary ? `rgba(${hexToRgb(color)}, 0.2)` : 'transparent',
                                    borderRadius: '3px'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        width: '26px',
                                        color: summary.isPrimary ? color : '#666'
                                    }}>
                                        P{summary.percentile}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: summary.isPrimary ? 'bold' : 'normal',
                                        color: summary.isPrimary ? color : '#333'
                                    }}>
                                        {summary.mean}
                                        {units && <span style={{ marginLeft: '2px', fontSize: '10px' }}>{units}</span>}
                                    </div>
                                </div>
                            ))}
                            <div style={{
                                fontSize: '9px',
                                color: '#999',
                                textAlign: 'center',
                                marginTop: '2px'
                            }}>
                                mean
                            </div>
                        </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <Button
                        type="link"
                        icon={dataTableVisible ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setDataTableVisible(!dataTableVisible)}
                        style={{ paddingLeft: 0, marginBottom: 8 }}
                    >
                        {dataTableVisible ? 'Hide data table' : 'Show data table'}
                    </Button>

                    {dataTableVisible && (
                        <div style={{ marginBottom: 16 }}>
                            <Table
                                columns={columns}
                                dataSource={tableData}
                                size="small"
                                pagination={false}
                                scroll={{ x: 'max-content', y: 300 }}
                                bordered
                            />
                        </div>
                    )}
                </>
            ) : (
                <Empty
                    description="No simulation results available"
                    style={{ padding: '40px 0' }}
                />
            )}
        </Card>
    );
};

export default DistributionCard;