// src/pages/simulations/OperationalRisks.jsx

import React from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    FieldTimeOutlined,
    ThunderboltOutlined,
    LineChartOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useInputSim from '../../hooks/useInputSim';
import { DistributionCard } from '../../components/cards';

const { Title, Paragraph } = Typography;

// Operational risks distribution fields configuration
const operationalRisksFields = [
    {
        name: 'Energy Production',
        path: ['settings', 'modules', 'revenue', 'energyProduction'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction'],
        key: 'energyProduction',
        icon: <ThunderboltOutlined style={{ color: '#1890ff' }} />,
        units: 'MWh',
        color: '#1890ff'
    },
    {
        name: 'Downtime Per Event',
        path: ['settings', 'modules', 'revenue', 'downtimePerEvent'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'downtimePerEvent'],
        key: 'downtimePerEvent',
        icon: <FieldTimeOutlined style={{ color: '#faad14' }} />,
        units: 'hours',
        color: '#faad14',
        precision: 0
    }
];

/**
 * Operational Risks analysis page showing performance-driven distributions
 * (energy production, downtime per event)
 */
const OperationalRisks = () => {
    const { getValueByPath, scenarioData } = useScenario();
    const { updateDistributions, loading } = useInputSim();

    // Fetch data from context
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

    // Check if any operational risk has valid results
    const hasResults = operationalRisksFields.some(field => {
        const simInfo = distributionAnalysis[field.key];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Operational Risks</Title>
                <Card>
                    <Paragraph>No active scenario. Please create or load a scenario first.</Paragraph>
                </Card>
            </div>
        );
    }

    return (
        <div className="operational-risks" style={{ padding: '20px' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={2}>Operational Risks</Title>
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
                This page shows the operational performance factors that affect project economics.
                These distributions represent asset performance, maintenance events, and operational
                efficiency that are within the project's operational control and management scope.
            </Paragraph>

            <Divider />

            {/* Simulation Parameters Card */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Operational Performance Parameters" bordered={true}>
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

            {/* Operational Risks Distribution Charts */}
            <Spin spinning={loading} tip="Updating operational risk distributions...">
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    {hasResults ? (
                        operationalRisksFields.map((field, index) => {
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
                                message="No Operational Risk Results"
                                description="Please click 'Update Distributions' to generate simulation results for operational performance factors."
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

export default OperationalRisks;