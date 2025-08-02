// src/pages/analyses/Sensitivity.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Space, Typography, Divider, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    DotChartOutlined,
    SettingOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useCube } from '../../contexts/CubeContext';
import { FormSection, ResponsiveFieldRow } from '../../components/contextFields/layouts';
import PercentileSelector from '../../components/forms/selectors/PercentileSelector';

// Import card components
import DriverExplorerCard from '../../components/cards/DriverExplorerCard';

const { Title, Paragraph, Text } = Typography;

// Sensitivity card registry
export const SENSITIVITY_CARD_REGISTRY = {
    driverExplorer: {
        component: DriverExplorerCard,
        enabled: true,
        gridProps: { span: 24 },
        order: 1,
        type: 'analysis',
        name: 'Value Driver Analysis',
        category: 'Sensitivity',
        description: 'Tornado charts and correlation analysis showing key value drivers and risk factors',
        props: {
            title: "Value Driver Analysis",
            showMetricsTable: true
        }
    }
    // Future cards can be added here (correlation heatmaps, scenario analysis, etc.)
};

// Card Error Boundary Component
const CardErrorBoundary = ({ children, cardName, gridProps = {} }) => {
    return children;
};

// Placeholder Card Component
const PlaceholderCard = ({ cardConfig }) => {
    return (
        <Card style={{ textAlign: 'center', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
                <SettingOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
                <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
                    {cardConfig.name} - Coming Soon
                </Title>
                <Paragraph style={{ color: '#999', margin: 0 }}>
                    {cardConfig.description}
                </Paragraph>
                {cardConfig.requiredLineItems && (
                    <Text style={{ fontSize: '12px', color: '#bbb', marginTop: '16px', display: 'block' }}>
                        Required: {cardConfig.requiredLineItems.join(', ')}
                    </Text>
                )}
            </div>
        </Card>
    );
};

const Sensitivity = () => {
    // Scenario and cube context
    const { scenarioData } = useScenario();

    // Updated: Use CubeContext for cube-related data
    const {
        sourceData,
        isLoading,
        refreshStage,
        refreshCubeData,
        getPercentileData,
        cubeError
    } = useCube();

    // Set up clean local percentile variables from cube
    const percentileInfo = getPercentileData();
    const selectedPercentile = percentileInfo?.selected;
    const availablePercentiles = percentileInfo?.available || [];
    const primaryPercentile = percentileInfo?.primary;
    const percentileStrategy = percentileInfo?.strategy;

    // Auto-initialize on first access if not already initialized
    useEffect(() => {
        if (!sourceData && !isLoading && scenarioData) {
            console.log('🧊 Cube data accessed for first time, initializing...');
            refreshCubeData(false); // Auto-initialize with dependency checking
        }
    }, [sourceData, isLoading, scenarioData, refreshCubeData]);

    // Local state for card visibility
    const [cardVisibility, setCardVisibility] = useState(() => {
        const initialVisibility = {};
        Object.keys(SENSITIVITY_CARD_REGISTRY).forEach(cardId => {
            initialVisibility[cardId] = SENSITIVITY_CARD_REGISTRY[cardId].enabled;
        });
        return initialVisibility;
    });

    // Handle card visibility toggle
    const toggleCardVisibility = (cardId) => {
        setCardVisibility(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    // Single refresh handler
    const handleRefresh = () => {
        refreshCubeData(true); // Force refresh of cube data
    };

    // Refresh stage display mapping
    const refreshStageDisplay = {
        idle: { icon: '⏸️', text: 'Ready', color: '#666' },
        initialization: { icon: '🔄', text: 'Initializing', color: '#1890ff' },
        dependencies: { icon: '🔍', text: 'Checking Dependencies', color: '#1890ff' },
        sources: { icon: '📊', text: 'Processing Sources', color: '#1890ff' },
        metrics: { icon: '📈', text: 'Computing Metrics', color: '#1890ff' },
        complete: { icon: '✅', text: 'Complete', color: '#52c41a' }
    };

    const currentStageDisplay = refreshStageDisplay[refreshStage] || refreshStageDisplay.idle;

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div style={{ padding: '20px' }}>
                <Title level={2}>Sensitivity Analysis</Title>
                <Card>
                    <Alert
                        message="No Active Scenario"
                        description="Please create or load a scenario first to analyze sensitivity data."
                        type="info"
                        showIcon
                    />
                </Card>
            </div>
        );
    }

    // Get enabled cards sorted by order
    const enabledCards = Object.entries(SENSITIVITY_CARD_REGISTRY)
        .filter(([cardId, config]) => cardVisibility[cardId] && config.enabled)
        .sort(([, a], [, b]) => (a.order || 999) - (b.order || 999));

    return (
        <div className="sensitivity-analysis" style={{ padding: '20px' }}>
            {/* Header Section */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Col>
                    <Title level={2}>Sensitivity Analysis</Title>
                </Col>
                <Col>
                    <Space>
                        {/* Enhanced status display with stage info */}
                        {isLoading && (
                            <Alert
                                message={
                                    <Space size="large" style={{ fontSize: '12px', color: '#666' }}>
                                        <span style={{ color: currentStageDisplay.color }}>
                                            {currentStageDisplay.icon} {currentStageDisplay.text}...
                                        </span>
                                        {refreshStage !== 'distributions' && (
                                            <span style={{ color: '#52c41a' }}>✅ Previous stages complete</span>
                                        )}
                                    </Space>
                                }
                                type="info"
                                showIcon={false}
                                style={{ marginBottom: 0, padding: '4px 8px' }}
                            />
                        )}

                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh Data'}
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Paragraph>
                Sensitivity analysis identifies the key value drivers and risk factors that most significantly
                impact your wind project's financial performance. Use tornado charts and correlation analysis
                to understand which variables require the most attention in risk management and optimization.
            </Paragraph>

            <FormSection title="Percentile Selection" level={4}>
                <ResponsiveFieldRow layout="twoColumn">
                    <PercentileSelector />
                    <div>
                        <Space direction="vertical" size="small">
                            <Text strong>Available Percentiles:</Text>
                            <Text type="secondary">
                                {availablePercentiles.length > 0
                                    ? availablePercentiles.map(p => `P${p}`).join(', ')
                                    : 'No percentiles configured'
                                }
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Strategy: {selectedPercentile?.strategy || 'unified'}
                            </Text>
                        </Space>
                    </div>
                </ResponsiveFieldRow>
            </FormSection>

            <Divider />

            {/* Sensitivity Data Summary */}
            {sourceData && (
                <FormSection title="Data Summary" level={4}>
                    <ResponsiveFieldRow layout="fourColumn">
                        <Card size="small" bordered={false}>
                            <Text type="secondary">Line Items</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {sourceData.length || 0}
                            </Title>
                        </Card>
                        <Card size="small" bordered={false}>
                            <Text type="secondary">Project Life</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {scenarioData.settings?.general?.projectLife || 0} years
                            </Title>
                        </Card>
                        <Card size="small" bordered={false}>
                            <Text type="secondary">Currency</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {scenarioData.settings?.project?.currency.local || 'USD'}
                            </Title>
                        </Card>
                        <Card size="small" bordered={false}>
                            <Text type="secondary">WTGs</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {scenarioData.settings?.project?.windFarm.numWTGs || 0}
                            </Title>
                        </Card>
                    </ResponsiveFieldRow>
                </FormSection>
            )}

            <Divider />

            {/* Cards Section */}
            {isLoading ? (
                <Card>
                    <Spin tip="Refreshing sensitivity analysis..." style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px'
                    }} />
                </Card>
            ) : !sourceData ? (
                <Card>
                    <Alert
                        message="No Sensitivity Data"
                        description="Please refresh to initialize the sensitivity analysis system."
                        type="info"
                        showIcon
                        action={
                            <Button onClick={handleRefresh} loading={isLoading}>
                                Refresh Data
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <Row gutter={[16, 16]}>
                    {enabledCards.map(([cardId, cardConfig]) => {
                        const CardComponent = cardConfig.component;

                        return (
                            <Col key={cardId} {...cardConfig.gridProps}>
                                <CardErrorBoundary cardName={cardConfig.name} gridProps={cardConfig.gridProps}>
                                    {CardComponent ? (
                                        <CardComponent
                                            selectedPercentiles={selectedPercentile}
                                            cardConfig={cardConfig}
                                            percentileInfo={percentileInfo}
                                            {...(cardConfig.props || {})}
                                        />
                                    ) : (
                                        <PlaceholderCard cardConfig={cardConfig} />
                                    )}
                                </CardErrorBoundary>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
};

export default Sensitivity;