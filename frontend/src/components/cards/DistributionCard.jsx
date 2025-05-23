// src/components/cards/DistributionCard.jsx

import React, { useState } from 'react';
import { Card, Space, Typography, Empty, Tooltip, Badge, Alert, Button } from 'antd';
import { InfoCircleOutlined, TableOutlined, SwapOutlined } from '@ant-design/icons';
import PercentileChart from '../charts/PercentileChart';
import StatisticsChart from '../charts/StatisticsChart';
import { generateDistributionMetadata } from '../../utils/chartUtils';

const { Text } = Typography;

// Main component for displaying distribution analysis
/**
 * Reusable component for displaying distribution analysis charts and tables.
 * @param {Object} props - Component props
 * @param {Object} props.simulationInfo - SimulationInfoSchema object containing simulation results
 * @param {number} [props.primaryPercentile=50] - Primary percentile value (e.g., 50 for P50)
 * @param {string} [props.title] - Optional title override
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {string} [props.units=''] - Units to display (e.g., 'MWh')
 * @param {string} [props.color='#1890ff'] - Base color for the chart
 * @param {Object} [props.cardProps={}] - Additional props for Card component
 * @param {number} [props.height=300] - Chart height
 * @param {Object} [props.extraLayoutOptions={}] - Additional Plotly layout options
 * @param {boolean} [props.showMetadata=true] - Whether to show simulation metadata
 * @param {number|null} [props.precision=null] - Number of decimal places (null for Plotly default)
 * @returns {JSX.Element} Distribution analysis card
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
    // State for toggling chart mode and table visibility
    const [dataTableVisible, setDataTableVisible] = useState(false);
    const [chartMode, setChartMode] = useState('percentiles');

    // Handle null simulationInfo
    if (!simulationInfo) {
        return (
            <Card title={title || 'Distribution Analysis'} variant="outlined" {...cardProps}>
                <Empty description="No simulation data available" />
            </Card>
        );
    }

    // Extract metadata and check for errors
    const { distribution = {}, iterations = 0, timeElapsed = 0, errors = [] } = simulationInfo;
    const hasErrors = errors.length > 0;
    const hasResults = simulationInfo.results?.length > 0;

    // Generate distribution metadata
    const distMetadata = generateDistributionMetadata(distribution);
    const paramString = Object.entries(distMetadata.parameters)
        .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(precision || 2) : value} `)
        .join(', ');

    // Compute card title
    const cardTitle = title || distMetadata.name || 'Distribution Analysis';

    // Render title
    const titleContent = (
        <Space>
            {icon}
            <Text>{cardTitle}</Text>
        </Space>
    );

    // Render card extra with metadata and controls
    const cardExtra = (
        <Space>
            {showMetadata && (
                <Tooltip title={`${iterations.toLocaleString()} iterations, ${timeElapsed.toFixed(2)}ms execution time`}>
                    <Space>
                        <Badge count={hasErrors ? errors.length : 0} color="red" size="small">
                            <InfoCircleOutlined style={{ fontSize: '16px', cursor: 'pointer' }} />
                        </Badge>
                    </Space>
                </Tooltip>
            )}
            <Tooltip title={paramString ? `Parameters: ${paramString} ` : 'No parameters'}>
                <Text type="secondary" style={{ fontSize: '12px', color: '#999' }}>
                    {distMetadata.name}
                </Text>
            </Tooltip>
            {hasResults && (
                <Tooltip title={dataTableVisible ? 'Hide data table' : 'Show data table'}>
                    <Button
                        type="text"
                        icon={<TableOutlined style={{ color: dataTableVisible ? color : 'inherit', fontSize: '16px' }} />}
                        onClick={() => setDataTableVisible(!dataTableVisible)}
                        size="small"
                    />
                </Tooltip>
            )}
            {hasResults && (
                <Tooltip title={`Switch to ${chartMode === 'percentiles' ? 'Statistics' : 'Percentiles'} mode`}>
                    <Button
                        type="text"
                        icon={<SwapOutlined style={{ color: chartMode === 'percentiles' ? 'inherit' : color, fontSize: '16px' }} />}
                        onClick={() => setChartMode(chartMode === 'percentiles' ? 'statistics' : 'percentiles')}
                        size="small"
                    />
                </Tooltip>
            )}
        </Space>
    );

    // Render card with conditional chart mode
    return (
        <Card title={titleContent} variant="outlined" extra={cardExtra} {...cardProps}>
            {hasErrors ? (
                <Alert
                    message={`Simulation Error${errors.length > 1 ? 's' : ''} `}
                    description={
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {errors.map((error, i) => <li key={i}>{error}</li>)}
                        </ul>
                    }
                    type="error"
                    showIcon
                />
            ) : (
                chartMode === 'percentiles' ? (
                    <PercentileChart
                        simulationInfo={simulationInfo}
                        primaryPercentile={primaryPercentile}
                        color={color}
                        units={units}
                        precision={precision}
                        height={height}
                        extraLayoutOptions={extraLayoutOptions}
                        dataTableVisible={dataTableVisible}
                        toggleTableVisibility={() => setDataTableVisible(!dataTableVisible)}
                    />
                ) : (
                    <StatisticsChart
                        simulationInfo={simulationInfo}
                        primaryPercentile={primaryPercentile}
                        color={color}
                        units={units}
                        precision={precision}
                        height={height}
                        extraLayoutOptions={extraLayoutOptions}
                        dataTableVisible={dataTableVisible}
                        toggleTableVisibility={() => setDataTableVisible(!dataTableVisible)}
                    />
                )
            )}
        </Card>
    );
};

export default DistributionCard;