// src/components/analysis/DistributionAnalysis.jsx

import React from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, Alert, Spin } from 'antd';
import {
  ReloadOutlined,
  AreaChartOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useInputSim from '../../hooks/useInputSim';
import { DistributionCard } from '../cards';

const { Title, Paragraph } = Typography;

// Static distribution fields configuration
const distributionFields = [
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
    name: 'Downtime Per Event',
    path: ['settings', 'modules', 'revenue', 'downtimePerEvent'],
    contextPath: ['simulation', 'inputSim', 'distributionAnalysis', 'downtimePerEvent'],
    key: 'downtimePerEvent',
    icon: <FieldTimeOutlined style={{ color: '#faad14' }} />,
    units: 'hours',
    color: '#faad14',
    precision: 0
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


// Component for displaying distribution analysis dashboard
/**
 * Displays a dashboard for analyzing probability distributions in Monte Carlo simulations.
 * @returns {JSX.Element} Distribution analysis dashboard
 */
const DistributionAnalysis = () => {
  const { getValueByPath, scenarioData } = useScenario();
  const { updateDistributions, loading } = useInputSim();

  // Fetch data from context
  const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
  const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
  const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
  const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

  // Check if any distribution has valid results
  const hasResults = distributionFields.some(field => {
    const simInfo = distributionAnalysis[field.key];
    return simInfo && simInfo.results && simInfo.results.length > 0;
  });

  // Handle no active scenario
  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Distribution Analysis Dashboard</Title>
        <Card>
          <Paragraph>No active scenario. Please create or load a scenario first.</Paragraph>
        </Card>
      </div>
    );
  }


  return (
    <div className="distribution-dashboard" style={{ padding: '20px' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2}>Distribution Analysis Dashboard</Title>
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
        This dashboard shows the key probability distributions used in the Monte Carlo simulation.
        The charts display percentile bands with the primary percentile (P{primaryPercentile}) highlighted.
        Click "Update Distributions" to generate results based on the current distributions.
      </Paragraph>

      <Divider />

      {/* Simulation Parameters Card */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Simulation Parameters" bordered={true}>
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

      {/* Distribution Charts or Alert */}
      <Spin spinning={loading} tip="Updating distributions...">
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {hasResults ? (
            distributionFields.map((field, index) => {
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
                message="No Simulation Results"
                description="Please click 'Update Distributions' to generate simulation results."
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

export default DistributionAnalysis;