// src/pages/simulations/MarketFactorsSimulation.jsx

import React from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    RiseOutlined,
    LineChartOutlined,
    DollarOutlined,
    UserOutlined,
    ToolOutlined,
    BuildOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useInputSim from '../../hooks/useInputSim';
import { DistributionCard } from '../../components/cards';
import { getMarketFactorColorScheme } from '../../utils/charts/colors';

const { Title, Paragraph } = Typography;

// Icon mapping for different market factor types
const MARKET_FACTOR_ICONS = {
    material: <DollarOutlined />,
    labor: <UserOutlined />,
    tooling: <ToolOutlined />,
    crane: <BuildOutlined />,
    contractsLocal: <FileTextOutlined />,
    contractsForeign: <GlobalOutlined />,
    other: <AppstoreOutlined />,
    escalationRate: <RiseOutlined />,
    baseEscalationRate: <RiseOutlined />
};

/**
 * Market Factors simulation page showing market-driven cost factor distributions.
 * Dynamically reads market factors from scenario data and displays distribution cards
 * for each configured market factor, providing Monte Carlo analysis visualization.
 * 
 * @returns {JSX.Element} Market factors simulation page component
 */
const MarketFactorsSimulation = () => {
    const { getValueByPath, scenarioData } = useScenario();
    const { updateDistributions, loading } = useInputSim();

    // Get market factors from dynamic object structure
    const marketFactorsObject = getValueByPath(['settings', 'project', 'economics', 'marketFactors', 'factors'], {});
    // Convert object values to array, filtering out non-object entries
    const marketFactorsArray = Object.values(marketFactorsObject || {}).filter(factor => 
        factor && typeof factor === 'object' && factor.id
    );
    
    // Fetch simulation data from context
    const marketFactorResults = getValueByPath(['simulation', 'inputSim', 'marketFactors'], {});
    const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

    // Check if any market factor has valid results
    const hasResults = marketFactorsArray.some(factor => {
        const simInfo = marketFactorResults[factor.id];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Market Factors</Title>
                <Card>
                    <Paragraph>No active scenario. Please create or load a scenario first.</Paragraph>
                </Card>
            </div>
        );
    }

    // Handle no market factors configured
    if (!marketFactorsArray || marketFactorsArray.length === 0) {
        return (
            <div className="market-factors-simulation" style={{ padding: '20px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>Market Factors</Title>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={updateDistributions}
                            loading={loading}
                        >
                            Update Distributions
                        </Button>
                    </Col>
                </Row>

                <Paragraph>
                    This page shows market-driven cost escalation factors that affect project economics.
                    These distributions represent market volatility in material costs, labor rates, and service pricing
                    that impact repair and maintenance expenses.
                </Paragraph>

                <Divider />

                <Alert
                    message="No Market Factors Configured"
                    description="Please configure market factors in the Economics section first to see simulation results."
                    type="info"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div className="market-factors-simulation" style={{ padding: '20px' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={2}>Market Factors</Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={updateDistributions}
                        loading={loading}
                    >
                        Update Distributions
                    </Button>
                </Col>
            </Row>

            <Paragraph>
                This page shows market-driven cost escalation factors that affect project economics.
                These distributions represent market volatility in material costs, labor rates, and service pricing
                that impact repair and maintenance expenses over the project lifecycle.
            </Paragraph>

            <Divider />

            {/* Simulation Parameters Card */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Market Factor Parameters" bordered={true}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Monte Carlo Iterations"
                                    value={getValueByPath(['settings', 'simulation', 'iterations'], 10000)}
                                    suffix="runs"
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Primary Percentile"
                                    value={`P${primaryPercentile} `}
                                    prefix={<LineChartOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Percentiles Tracked"
                                    value={percentiles.length}
                                    suffix="values"
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Project Timeline"
                                    value={projectYears}
                                    suffix="years"
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Market Factors Distribution Charts */}
            <Spin spinning={loading} tip="Updating market factor distributions...">
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    {hasResults ? (
                        marketFactorsArray.map((factor, index) => {
                            const simulationInfo = marketFactorResults[factor.id] || {};
                            
                            // Determine color scheme - try to match factor ID to cost categories
                            // or fall back to a default color
                            const fieldColor = getMarketFactorColorScheme(factor.id) || getMarketFactorColorScheme('other');
                            
                            // Get appropriate icon for this factor
                            const factorIcon = MARKET_FACTOR_ICONS[factor.id] || 
                                              MARKET_FACTOR_ICONS.baseEscalationRate ||
                                              MARKET_FACTOR_ICONS.escalationRate;
                            
                            const iconWithColor = React.cloneElement(factorIcon, {
                                style: { color: fieldColor }
                            });
                            
                            return (
                                <Col span={24} key={factor.id}>
                                    <DistributionCard
                                        simulationInfo={simulationInfo}
                                        primaryPercentile={primaryPercentile}
                                        title={factor.name}
                                        icon={iconWithColor}
                                        units="multiplier"
                                        color={fieldColor}
                                        precision={3}
                                        cardProps={{ 
                                            style: { marginBottom: '16px' },
                                            extra: factor.isDefault ? (
                                                <span style={{ fontSize: '12px', color: '#666' }}>
                                                    Default Factor
                                                </span>
                                            ) : null
                                        }}
                                    />
                                </Col>
                            );
                        })
                    ) : (
                        <Col span={24}>
                            <Alert
                                message="No Market Factor Results"
                                description="Please click 'Update Distributions' to generate simulation results for market factors."
                                type="info"
                                showIcon
                            />
                        </Col>
                    )}
                </Row>
            </Spin>
        </div>
    );
};

export default MarketFactorsSimulation;