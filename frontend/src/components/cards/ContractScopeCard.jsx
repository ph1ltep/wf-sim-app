// src/components/cards/ContractScopeCard.jsx

import React, { useState } from 'react';
import { Card, Space, Typography, Empty, Tooltip, Badge, Alert, Button, Select } from 'antd';
import { InfoCircleOutlined, TableOutlined, FileTextOutlined } from '@ant-design/icons';
import ContractScopeChart, { VISUALIZATION_STRATEGIES } from '../charts/ContractScopeChart';

const { Text } = Typography;
const { Option } = Select;

/**
 * ContractScopeCard - Reusable component for displaying contract scope analysis
 * @param {Object} props - Component props
 * @param {Array} props.oemContracts - Array of contract objects from schema (settings.modules.contracts.oemContracts)
 * @param {number} [props.projectLife=20] - Project duration in years
 * @param {number} [props.numWTGs=20] - Number of wind turbine generators
 * @param {string} [props.currency='USD'] - Currency code for display
 * @param {string} [props.title] - Optional title override
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {string} [props.color='#1890ff'] - Base color for the chart
 * @param {Object} [props.cardProps={}] - Additional props for Card component
 * @param {number} [props.height=400] - Chart height
 * @param {Object} [props.extraLayoutOptions={}] - Additional Plotly layout options
 * @param {boolean} [props.showMetadata=true] - Whether to show contract metadata
 * @param {boolean} [props.loading=false] - Loading state
 * @returns {JSX.Element} Contract scope analysis card
 */
const ContractScopeCard = ({
    oemContracts = [],
    projectLife = 20,
    numWTGs = 20,
    currency = 'USD',
    title,
    icon,
    color = '#1890ff',
    cardProps = {},
    height = 400,
    extraLayoutOptions = {},
    showMetadata = true,
    loading = false
}) => {
    // State for visualization mode selection
    const [visualizationMode, setVisualizationMode] = useState('fee-total');

    // Handle null oemContracts
    if (!oemContracts) {
        return (
            <Card title={title || 'Contract Scope Analysis'} variant="outlined" {...cardProps}>
                <Empty description="No contract data available" />
            </Card>
        );
    }

    // Extract contract metadata
    const contractCount = oemContracts.length;
    const hasContracts = contractCount > 0;
    const totalYearsCovered = hasContracts ?
        new Set(oemContracts.flatMap(contract => contract.years || [])).size : 0;
    const coveragePercentage = projectLife > 0 ? Math.round((totalYearsCovered / projectLife) * 100) : 0;

    // Calculate total fees for metadata
    const totalFees = hasContracts ?
        oemContracts.reduce((sum, contract) => {
            const yearsCount = contract.years?.length || 0;
            const annualFee = contract.isPerTurbine ?
                (contract.fixedFee || 0) * numWTGs :
                (contract.fixedFee || 0);
            return sum + (annualFee * yearsCount);
        }, 0) : 0;

    // Calculate per-WTG statistics for summary
    const calculatePerWTGStats = () => {
        if (!hasContracts || numWTGs === 0) return { avg: 0, min: 0, max: 0 };

        const annualFeesPerWTG = [];

        // For each year, calculate total fee per WTG
        for (let year = 1; year <= projectLife; year++) {
            let yearTotal = 0;
            oemContracts.forEach(contract => {
                if (contract.years?.includes(year)) {
                    const annualFee = contract.isPerTurbine ?
                        (contract.fixedFee || 0) :
                        (contract.fixedFee || 0) / numWTGs;
                    yearTotal += annualFee;
                }
            });
            if (yearTotal > 0) annualFeesPerWTG.push(yearTotal);
        }

        if (annualFeesPerWTG.length === 0) return { avg: 0, min: 0, max: 0 };

        const avg = annualFeesPerWTG.reduce((sum, fee) => sum + fee, 0) / annualFeesPerWTG.length;
        const min = Math.min(...annualFeesPerWTG);
        const max = Math.max(...annualFeesPerWTG);

        return { avg, min, max };
    };

    const perWTGStats = calculatePerWTGStats();

    // Compute card title
    const cardTitle = title || 'Contract Scope Analysis';

    // Render title with icon
    const titleContent = (
        <Space>
            {icon || <FileTextOutlined />}
            <Text>{cardTitle}</Text>
        </Space>
    );

    // Get current visualization strategy for metadata
    const currentStrategy = VISUALIZATION_STRATEGIES[visualizationMode];

    // Render card extra with metadata and controls
    const cardExtra = (
        <Space>
            {showMetadata && (
                <Tooltip title={`${contractCount} contracts, ${coveragePercentage}% year coverage, Total: ${currency}${totalFees.toLocaleString()}`}>
                    <Space>
                        <Badge count={contractCount} color="blue" size="small">
                            <InfoCircleOutlined style={{ fontSize: '16px', cursor: 'pointer' }} />
                        </Badge>
                    </Space>
                </Tooltip>
            )}

            {hasContracts && (
                <Select
                    value={visualizationMode}
                    onChange={setVisualizationMode}
                    style={{ minWidth: 120 }}
                    size="small"
                >
                    {Object.entries(VISUALIZATION_STRATEGIES).map(([key, strategy]) => (
                        <Option key={key} value={key}>
                            {strategy.name}
                        </Option>
                    ))}
                </Select>
            )}
        </Space>
    );

    // Render main card content
    return (
        <Card title={titleContent} variant="outlined" extra={cardExtra} {...cardProps}>
            {!hasContracts ? (
                <Empty
                    description="No contracts defined"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            ) : (
                <>

                    {/* Contract scope heatmap chart */}
                    <ContractScopeChart
                        oemContracts={oemContracts}
                        projectLife={projectLife}
                        numWTGs={numWTGs}
                        currency={currency}
                        visualizationMode={visualizationMode}
                        height={height}
                        color={color}
                        loading={loading}
                    />

                    {/* Additional metadata section */}
                    {showMetadata && (
                        <div style={{ marginTop: 16, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                            <Space split={<span style={{ color: '#d9d9d9' }}>|</span>} wrap>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Contracts:</strong> {contractCount}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Coverage:</strong> {totalYearsCovered}/{projectLife} years ({coveragePercentage}%)
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Total Value:</strong> {currency}{totalFees.toLocaleString()}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Annual Avg/WTG:</strong> {currency}{Math.round(perWTGStats.avg).toLocaleString()}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Annual Min/WTG:</strong> {currency}{Math.round(perWTGStats.min).toLocaleString()}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Annual Max/WTG:</strong> {currency}{Math.round(perWTGStats.max).toLocaleString()}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <strong>Total WTGs:</strong> {numWTGs}
                                </Text>
                            </Space>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};

export default ContractScopeCard;