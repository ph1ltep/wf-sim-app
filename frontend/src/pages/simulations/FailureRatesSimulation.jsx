// src/pages/simulations/FailureRatesSimulation.jsx

import React from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    LineChartOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useInputSim from '../../hooks/useInputSim';
import { DistributionCard } from '../../components/cards';
import { getComponentCategoryColorScheme } from '../../utils/charts/colors';

const { Title, Paragraph } = Typography;

// Standardized icon for all failure rate components
const FAILURE_RATE_ICON = <WarningOutlined />;

/**
 * Failure Rates simulation page showing component failure rate distributions.
 * Dynamically reads failure rate components from scenario data and displays distribution cards
 * for each enabled component, providing Monte Carlo analysis visualization.
 * 
 * @returns {JSX.Element} Failure rates simulation page component
 */
const FailureRatesSimulation = () => {
    const { getValueByPath, scenarioData } = useScenario();
    const { updateDistributions, loading } = useInputSim();

    // Get failure rates configuration
    const failureRatesConfig = getValueByPath(['settings', 'project', 'equipment', 'failureRates'], {});
    const failureRatesEnabled = failureRatesConfig.enabled || false;
    
    // Get failure rate components from dynamic object structure
    const failureRatesObject = failureRatesConfig.components || {};
    // Convert object values to array, filtering enabled components
    const failureRatesArray = Object.values(failureRatesObject || {}).filter(component => 
        component && typeof component === 'object' && component.enabled && component.id
    );
    
    // Fetch simulation data from context
    const failureRateResults = getValueByPath(['simulation', 'inputSim', 'failureRates'], {});
    const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

    // Check if any failure rate component has valid results
    const hasResults = failureRatesArray.some(component => {
        const simInfo = failureRateResults[component.id];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Component Failure Rates</Title>
                <Card>
                    <Paragraph>No active scenario. Please create or load a scenario first.</Paragraph>
                </Card>
            </div>
        );
    }

    // Handle failure rates not enabled globally
    if (!failureRatesEnabled) {
        return (
            <div className="failure-rates-simulation" style={{ padding: '20px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>Component Failure Rates</Title>
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
                    This page shows component failure rate distributions that model the probability of component failures over time.
                    These distributions represent failure rates for major wind turbine components and their impact on maintenance costs
                    and project economics.
                </Paragraph>

                <Divider />

                <Alert
                    message="Component Failure Modeling Disabled"
                    description="Please enable component failure modeling in the Scenario → Equipment → Failure Rates section first to see simulation results."
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    // Handle no components configured or enabled
    if (!failureRatesArray || failureRatesArray.length === 0) {
        return (
            <div className="failure-rates-simulation" style={{ padding: '20px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2}>Component Failure Rates</Title>
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
                    This page shows component failure rate distributions that model the probability of component failures over time.
                    These distributions represent failure rates for major wind turbine components and their impact on maintenance costs
                    and project economics.
                </Paragraph>

                <Divider />

                <Alert
                    message="No Enabled Components"
                    description="Please configure and enable components in the Scenario → Equipment → Failure Rates section first to see simulation results."
                    type="info"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div className="failure-rates-simulation" style={{ padding: '20px' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={2}>Component Failure Rates</Title>
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
                This page shows component failure rate distributions that model the probability of component failures over time.
                Each distribution shows the annual failure rate per component (expressed as % chance per year), which is multiplied 
                by component quantities during Monte Carlo simulation to estimate total expected failures and maintenance costs 
                throughout the project lifecycle.
            </Paragraph>

            <Divider />

            {/* Simulation Parameters Card */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Component Failure Rate Parameters" bordered={true}>
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
                                    title="Enabled Components"
                                    value={failureRatesArray.length}
                                    suffix="components"
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

            {/* Component Failure Rate Distribution Charts */}
            <Spin spinning={loading} tip="Updating component failure rate distributions...">
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    {hasResults ? (
                        failureRatesArray.map((component, index) => {
                            const simulationInfo = failureRateResults[component.id] || {};
                            
                            // Determine color scheme based on component category
                            const fieldColor = getComponentCategoryColorScheme(component.category) || getComponentCategoryColorScheme('default');
                            
                            // Use standardized icon for all failure rate components
                            const iconWithColor = React.cloneElement(FAILURE_RATE_ICON, {
                                style: { color: fieldColor }
                            });
                            
                            return (
                                <Col span={24} key={component.id}>
                                    <DistributionCard
                                        simulationInfo={simulationInfo}
                                        primaryPercentile={primaryPercentile}
                                        title={component.name}
                                        icon={iconWithColor}
                                        units="%"
                                        color={fieldColor}
                                        precision={2}
                                        decimalStorage={true}
                                        cardProps={{ 
                                            style: { marginBottom: '16px' },
                                            extra: (
                                                <Space>
                                                    {component.isDefault && (
                                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                                            Default Component
                                                        </span>
                                                    )}
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        color: fieldColor,
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {component.category}
                                                    </span>
                                                </Space>
                                            )
                                        }}
                                    />
                                </Col>
                            );
                        })
                    ) : (
                        <Col span={24}>
                            <Alert
                                message="No Component Failure Rate Results"
                                description="Please click 'Update Distributions' to generate simulation results for component failure rates."
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

export default FailureRatesSimulation;