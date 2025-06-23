// src/components/results/cashflow/CashflowAnalysis.jsx - Main cashflow analysis page
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Space, Typography, Divider, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    BarChartOutlined,
    SettingOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useScenario } from '../../../contexts/ScenarioContext';
import { useCashflow } from '../../../contexts/CashflowContext';
import { FormSection, ResponsiveFieldRow } from '../../contextFields/layouts';
import PercentileSelector from './components/PercentileSelector';

// Import card components
import CashflowTimelineCard from '../../cards/CashflowTimelineCard';
import FinanceabilityCard from '../../cards/FinanceabilityCard';

const { Title, Paragraph, Text } = Typography;

// Simplified card registry
export const CASHFLOW_CARD_REGISTRY = {
    timeline: {
        component: CashflowTimelineCard,
        enabled: true,
        gridProps: { span: 24 },
        order: 1,
        type: 'detail',
        name: 'Timeline Analysis',
        category: 'Analysis',
        description: 'Cash flow timeline with revenue, costs, and net cashflow over project life'
    },
    financeability: {
        component: FinanceabilityCard,
        enabled: true,
        gridProps: { span: 24 },
        order: 2,
        type: 'summary',
        name: 'Financeability Analysis',
        category: 'Investment',
        description: 'Bankability metrics, DSCR analysis, and covenant compliance assessment'
    }
};

// Card Error Boundary Component
class CardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Card Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card
                    title={this.props.cardName || 'Card Error'}
                    variant="outlined"
                    {...this.props.gridProps}
                >
                    <Alert
                        message="Card Rendering Error"
                        description={`Failed to render ${this.props.cardName}: ${this.state.error?.message || 'Unknown error'}`}
                        type="error"
                        showIcon
                    />
                </Card>
            );
        }

        return this.props.children;
    }
}

// Placeholder Card Component
const PlaceholderCard = ({ cardConfig, ...props }) => {
    return (
        <Card
            title={
                <Space>
                    <BarChartOutlined />
                    <Text>{cardConfig.name}</Text>
                </Space>
            }
            variant="outlined"
            extra={
                <Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {cardConfig.category}
                    </Text>
                </Space>
            }
            {...props}
        >
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999',
                backgroundColor: '#fafafa',
                borderRadius: '6px',
                border: '2px dashed #d9d9d9'
            }}>
                <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
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

const CashflowAnalysis = () => {
    const { scenarioData } = useScenario();
    const {
        cashflowData,
        loading,
        transformError,
        availablePercentiles,
        selectedPercentiles,
        refreshCashflowData
    } = useCashflow();

    // Auto-initialize on first access if not already initialized
    useEffect(() => {
        if (!cashflowData && !loading && scenarioData) {
            console.log('💹 Cash Flows accessed for first time, initializing...');
            refreshCashflowData(false); // Auto-initialize with dependency checking
        }
    }, [cashflowData, loading, scenarioData, refreshCashflowData]);

    // Local state for card visibility
    const [cardVisibility, setCardVisibility] = useState(() => {
        const initialVisibility = {};
        Object.keys(CASHFLOW_CARD_REGISTRY).forEach(cardId => {
            initialVisibility[cardId] = CASHFLOW_CARD_REGISTRY[cardId].enabled;
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

    // UPDATED: Single refresh handler
    const handleRefresh = () => {
        refreshCashflowData(true); // Force refresh everything
    };

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div style={{ padding: '20px' }}>
                <Title level={2}>Cashflow Analysis</Title>
                <Card>
                    <Alert
                        message="No Active Scenario"
                        description="Please create or load a scenario first to analyze cashflow data."
                        type="info"
                        showIcon
                    />
                </Card>
            </div>
        );
    }

    // Handle transformation errors
    if (transformError) {
        return (
            <div style={{ padding: '20px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>Cashflow Analysis</Title>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={loading}
                        >
                            Retry
                        </Button>
                    </Col>
                </Row>

                <Card>
                    <Alert
                        message="Data Transformation Error"
                        description={transformError}
                        type="error"
                        showIcon
                        action={
                            <Button size="small" onClick={handleRefresh} loading={loading}>
                                Retry
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    // Get enabled cards sorted by order
    const enabledCards = Object.entries(CASHFLOW_CARD_REGISTRY)
        .filter(([cardId, config]) => cardVisibility[cardId] && config.enabled)
        .sort(([, a], [, b]) => (a.order || 999) - (b.order || 999));

    return (
        <div className="cashflow-analysis" style={{ padding: '20px' }}>
            {/* Header Section */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Col>
                    <Title level={2}>Cashflow Analysis</Title>
                </Col>
                <Col>
                    <Space>
                        {loading && (
                            <Alert
                                message="Refreshing..."
                                type="info"
                                size="small"
                                showIcon
                            />
                        )}
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={loading}
                        >
                            Refresh Data
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* Description and Controls */}
            <FormSection>
                <Paragraph>
                    This dashboard analyzes project cash flows using Monte Carlo simulation results with
                    escalation and other multiplier effects. Use the percentile selector to adjust confidence
                    levels for different data sources.
                </Paragraph>

                {/* UPDATED: Simplified status text */}
                {loading && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Refreshing dependencies and calculating metrics...
                    </Text>
                )}
                {!loading && cashflowData && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Data ready - last refreshed: {new Date().toLocaleTimeString()}
                    </Text>
                )}
            </FormSection>

            <Divider />

            {/* Percentile Selection Section */}
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
                                Strategy: {selectedPercentiles?.strategy || 'unified'}
                            </Text>
                        </Space>
                    </div>
                </ResponsiveFieldRow>
            </FormSection>

            <Divider />

            {/* Cashflow Data Summary */}
            {cashflowData && (
                <FormSection title="Data Summary" level={4}>
                    <ResponsiveFieldRow layout="fourColumn">
                        <Card size="small" bordered={false}>
                            <Text type="secondary">Line Items</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {cashflowData.lineItems?.length || 0}
                            </Title>
                        </Card>
                        <Card size="small" bordered={false}>
                            <Text type="secondary">Project Life</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {cashflowData.metadata?.projectLife || 0} years
                            </Title>
                        </Card>
                        <Card size="small" bordered={false}>
                            <Text type="secondary">Currency</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {cashflowData.metadata?.currency || 'USD'}
                            </Title>
                        </Card>
                        <Card size="small" bordered={false}>
                            <Text type="secondary">WTGs</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {cashflowData.metadata?.numWTGs || 0}
                            </Title>
                        </Card>
                    </ResponsiveFieldRow>
                </FormSection>
            )}

            <Divider />

            {/* Cards Section */}
            {loading ? (
                <Card>
                    <Spin tip="Refreshing cashflow analysis..." style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px'
                    }} />
                </Card>
            ) : !cashflowData ? (
                <Card>
                    <Alert
                        message="No Cashflow Data"
                        description="Please refresh to initialize the cashflow system."
                        type="info"
                        showIcon
                        action={
                            <Button onClick={handleRefresh} loading={loading}>
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
                                            cashflowData={cashflowData}
                                            selectedPercentiles={selectedPercentiles}
                                            cardConfig={cardConfig}
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

            {/* Debug Information (Development Only) */}
            {process.env.NODE_ENV === 'development' && cashflowData && (
                <>
                    <Divider />
                    <FormSection title="Debug Information" level={4}>
                        <Card size="small">
                            <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                                {JSON.stringify({
                                    metadata: cashflowData.metadata,
                                    lineItemCount: cashflowData.lineItems?.length,
                                    aggregationKeys: Object.keys(cashflowData.aggregations || {}),
                                    financeMetricKeys: Object.keys(cashflowData.financeMetrics || {}),
                                    selectedPercentiles,
                                    loading
                                }, null, 2)}
                            </pre>
                        </Card>
                    </FormSection>
                </>
            )}
        </div>
    );
};

export default CashflowAnalysis;