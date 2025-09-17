// src/pages/simulations/Environmental.jsx

import React from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, Alert, Spin } from 'antd';
import {
    ReloadOutlined,
    AreaChartOutlined,
    LineChartOutlined,
    CloudOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useInputSim from '../../hooks/useInputSim';
import { DistributionCard } from '../../components/cards';
import { getDistributionColorScheme } from '../../utils/charts/colors';

const { Title, Paragraph } = Typography;

// Environmental factors distribution fields configuration
const environmentalFactorsFields = [
    {
        name: 'Wind Variability',
        path: ['settings', 'project', 'environment', 'weather', 'windVariability'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'],
        key: 'windVariability',
        icon: <AreaChartOutlined />,
        units: 'm/s',
        precision: 1
    },
    {
        name: 'Rainfall Amount',
        path: ['settings', 'project', 'environment', 'weather', 'rainfallAmount'],
        contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'rainfallAmount'],
        key: 'rainfallAmount',
        icon: <CloudOutlined />,
        units: 'mm',
        precision: 0
    }
];

/**
 * Environmental analysis page showing environmental variability distributions
 * (wind variability, rainfall amount)
 */
const Environmental = () => {
    const { getValueByPath, scenarioData } = useScenario();
    const { updateDistributions, loading } = useInputSim();

    // Fetch data from context
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

    // Check if any environmental factor has valid results
    const hasResults = environmentalFactorsFields.some(field => {
        const simInfo = distributionAnalysis[field.key];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });

    // Handle no active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Environmental</Title>
                <Card>
                    <Paragraph>No active scenario. Please create or load a scenario first.</Paragraph>
                </Card>
            </div>
        );
    }

    return (
        <div className="environmental-factors" style={{ padding: '20px' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={2}>Environmental</Title>
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
                This page shows the environmental factors that affect project performance.
                These distributions represent natural variability in weather and wind conditions
                that impact energy generation and project operations.
            </Paragraph>

            <Divider />

            {/* Simulation Parameters Card */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Environmental Parameters" bordered={true}>
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

            {/* Environmental Factors Distribution Charts */}
            <Spin spinning={loading} tip="Updating environmental factor distributions...">
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    {hasResults ? (
                        environmentalFactorsFields.map((field, index) => {
                            const simulationInfo = distributionAnalysis[field.key] || {};
                            const fieldColor = getDistributionColorScheme(field.key);
                            const iconWithColor = React.cloneElement(field.icon, {
                                style: { color: fieldColor }
                            });
                            return (
                                <Col span={24} key={index}>
                                    <DistributionCard
                                        simulationInfo={simulationInfo}
                                        primaryPercentile={primaryPercentile}
                                        title={field.name}
                                        icon={iconWithColor}
                                        units={field.units}
                                        color={fieldColor}
                                        precision={field.precision}
                                        cardProps={{ style: { marginBottom: '16px' } }}
                                    />
                                </Col>
                            );
                        })
                    ) : (
                        <Col span={24}>
                            <Alert
                                message="No Environmental Results"
                                description="Please click 'Update Distributions' to generate simulation results for environmental factors."
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

export default Environmental;