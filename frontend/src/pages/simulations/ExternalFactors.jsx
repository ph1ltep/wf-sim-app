// src/pages/simulations/ExternalFactors.jsx

import React from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    DollarOutlined,
    RiseOutlined,
    AreaChartOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useInputSim from '../../hooks/useInputSim';
import { DistributionCard } from '../../components/cards';

const { Title, Paragraph } = Typography;

// External factors distribution fields configuration
const externalFactorsFields = [
    {
        name: 'Electricity Price',
        path: ['settings', 'modules', 'revenue', 'electricityPrice'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'electricityPrice'],
        key: 'electricityPrice',
        icon: <DollarOutlined style={{ color: '#52c41a' }} />,
        units: '$/MWh',
        color: '#52c41a',
        precision: 2
    },
    {
        name: 'Escalation Rate',
        path: ['settings', 'modules', 'cost', 'escalationRate'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'escalationRate'],
        key: 'escalationRate',
        icon: <RiseOutlined style={{ color: '#f5222d' }} />,
        units: '%',
        color: '#f5222d',
        precision: 2
    },
    {
        name: 'Wind Variability',
        path: ['settings', 'modules', 'revenue', 'windVariability'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'],
        key: 'windVariability',
        icon: <AreaChartOutlined style={{ color: '#eb2f96' }} />,
        units: 'm/s',
        color: '#eb2f96',
        precision: 1
    }
];

/**
 * External Factors analysis page showing market-driven distributions
 * (electricity price, escalation rate, wind variability)
 */
const ExternalFactors = () => {
    const { getValueByPath, scenarioData } = useScenario();
    const { updateDistributions, loading } = useInputSim();

    // Fetch data from context
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

    // Check if any external factor has valid results
    const hasResults = externalFactorsFields.some(field => {
        const simInfo = distributionAnalysis[field.key];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>External Factors</Title>
                <Card>
                    <Paragraph>No active scenario. Please create or load a scenario first.</Paragraph>
                </Card>
            </div>
        );
    }

    return (
        <div className="external-factors" style={{ padding: '20px' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={2}>External Factors</Title>
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
                This page shows the external market factors that drive project economics.
                These distributions represent market conditions beyond the project's direct control,
                including electricity pricing, escalation trends, and wind resource variability.
            </Paragraph>

            <Divider />

            {/* Simulation Parameters Card */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="External Market Parameters" bordered={true}>
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

            {/* External Factors Distribution Charts */}
            <Spin spinning={loading} tip="Updating external factor distributions...">
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    {hasResults ? (
                        externalFactorsFields.map((field, index) => {
                            const simulationInfo = distributionAnalysis[field.key] || {};
                            return (
                                <Col span={24} key={index}>
                                    <DistributionCard
                                        simulationInfo={simulationInfo}
                                        primaryPercentile={primaryPercentile}
                                        title={field.name}
                                        icon={field.icon}
                                        units={field.units}
                                        color={field.color}
                                        precision={field.precision}
                                        cardProps={{ style: { marginBottom: '16px' } }}
                                    />
                                </Col>
                            );
                        })
                    ) : (
                        <Col span={24}>
                            <Alert
                                message="No External Factor Results"
                                description="Please click 'Update Distributions' to generate simulation results for external market factors."
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

export default ExternalFactors;