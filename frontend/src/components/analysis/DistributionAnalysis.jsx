// src/components/analysis/DistributionAnalysis.jsx
import React, { useState } from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Button, message, Spin } from 'antd';
import {
  ReloadOutlined,
  AreaChartOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { simulateDistributions } from '../../api/simulation';
import { DistributionCard } from '../cards';

const { Title, Paragraph } = Typography;

// Helper function to generate sample SimulationInfoSchema data
const generateSampleSimulationInfo = (type, years = 20, percentiles, color) => {
  if (!percentiles || percentiles.length === 0) {
    return null;
  }

  // Generate results for each percentile
  const results = percentiles.map(percentile => {
    // Generate data points with some randomness based on percentile
    const factor = percentile.value / 50; // Scale factor based on percentile

    const data = Array.from({ length: years }, (_, i) => {
      // Base value increases over time
      const baseValue = 100 + (i * 5);

      // Apply percentile factor and some randomness
      const value = baseValue * factor * (0.9 + Math.random() * 0.2);

      return {
        year: i + 1,
        value: value
      };
    });

    return {
      name: `P${percentile.value}`,
      percentile: percentile,
      data: data
    };
  });

  // Create a sample SimulationInfoSchema object
  return {
    distribution: {
      type: type || 'normal',
      parameters: { value: 100, stdDev: 10 }
    },
    iterations: 10000,
    seed: 42,
    years: years,
    timeElapsed: Math.random() * 1000 + 500, // Random execution time between 500-1500ms
    results: results,
    errors: []
  };
};

const DistributionAnalysis = () => {
  const { getValueByPath, scenarioData, updateByPath } = useScenario();
  const [loading, setLoading] = useState(false);

  // State to track simulation results for each distribution
  const [simulationResults, setSimulationResults] = useState({});

  // Check if we have simulation settings
  const simulationSettings = getValueByPath(['settings', 'simulation'], null);
  const percentiles = simulationSettings?.percentiles || [];
  const primaryPercentile = simulationSettings?.primaryPercentile || 50;
  const projectYears = getValueByPath(['settings', 'general', 'projectLife'], 20);

  // Define the distribution fields to display
  const distributionFields = [
    {
      name: 'Energy Production',
      path: ['settings', 'modules', 'revenue', 'energyProduction'],
      icon: <ThunderboltOutlined style={{ color: '#1890ff' }} />,
      units: 'MWh',
      color: '#1890ff'
    },
    {
      name: 'Electricity Price',
      path: ['settings', 'modules', 'revenue', 'electricityPrice'],
      icon: <DollarOutlined style={{ color: '#52c41a' }} />,
      units: '$/MWh',
      color: '#52c41a'
    },
    {
      name: 'Downtime Per Event',
      path: ['settings', 'modules', 'revenue', 'downtimePerEvent'],
      icon: <FieldTimeOutlined style={{ color: '#faad14' }} />,
      units: 'hours',
      color: '#faad14'
    },
    {
      name: 'Wind Variability',
      path: ['settings', 'modules', 'revenue', 'windVariability'],
      icon: <AreaChartOutlined style={{ color: '#eb2f96' }} />,
      units: 'm/s',
      color: '#eb2f96'
    }
  ];

  // Get simulation info for a distribution
  const getSimulationInfo = (path) => {
    // Check if we have results in our state first
    const pathKey = path.join('.');
    if (simulationResults[pathKey]) {
      return simulationResults[pathKey];
    }

    // Try to get actual results from the scenario
    const actualData = getValueByPath([...path, 'data'], []);
    const distribution = getValueByPath([...path, 'distribution'], null);

    // If we have actual results, create a SimulationInfoSchema
    if (actualData && actualData.length > 0 && distribution) {
      return {
        distribution: distribution,
        iterations: simulationSettings?.iterations || 10000,
        seed: simulationSettings?.seed || 42,
        years: projectYears,
        timeElapsed: 0, // We don't know the actual time for stored results
        results: actualData,
        errors: []
      };
    }

    // Otherwise, generate sample data
    return generateSampleSimulationInfo(
      distribution?.type,
      projectYears,
      percentiles,
      distributionFields.find(f => f.path.join('.') === pathKey)?.color
    );
  };

  // Function to run the simulation for all distributions
  const runSimulation = async () => {
    setLoading(true);

    try {
      // Prepare distributions array for the API call
      const distributions = [];

      // Add each distribution from the revenue module
      for (const field of distributionFields) {
        const distribution = getValueByPath([...field.path, 'distribution'], null);
        if (distribution) {
          distributions.push(distribution);
        }
      }

      // Prepare simulation settings
      const simSettings = {
        iterations: simulationSettings?.iterations || 10000,
        seed: simulationSettings?.seed || 42,
        years: projectYears,
        percentiles: percentiles
      };

      // Create the SimRequestSchema object
      const simulationRequest = {
        distributions: distributions,
        simulationSettings: simSettings
      };

      // Make the API call
      const response = await simulateDistributions(simulationRequest);

      if (response.success) {
        // API call was successful
        const simulationInfo = response.data?.simulationInfo || [];

        // Process the results
        const newResults = {};

        // Map simulation results back to their respective distributions
        simulationInfo.forEach((info, index) => {
          if (index < distributionFields.length) {
            const field = distributionFields[index];
            const pathKey = field.path.join('.');

            // Store the complete SimulationInfoSchema object
            newResults[pathKey] = info;

            // Update the scenario context with just the results
            updateByPath([...field.path, 'data'], info.results);
          }
        });

        // Update our state with the new results
        setSimulationResults(newResults);

        message.success('Simulation completed successfully');
      } else {
        // API call failed
        message.error(response.error || 'Simulation failed');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      message.error('Error running simulation');
    } finally {
      setLoading(false);
    }
  };

  // Check if we have an active scenario
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
            onClick={runSimulation}
            loading={loading}
          >
            Run Simulation
          </Button>
        </Col>
      </Row>

      <Paragraph>
        This dashboard shows the key probability distributions used in the Monte Carlo simulation.
        The charts display percentile bands with the primary percentile (P{primaryPercentile}) highlighted.
        Click "Run Simulation" to generate results based on the current distributions.
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
                  value={simulationSettings?.iterations || 10000}
                  suffix="runs"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Primary Percentile"
                  value={`P${primaryPercentile}`}
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

      {/* Distribution Charts */}
      <Spin spinning={loading} tip="Running simulation...">
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {distributionFields.map((field, index) => {
            // Get the full SimulationInfoSchema for this distribution
            const simulationInfo = getSimulationInfo(field.path);

            return (
              <Col span={24} key={index}>
                <DistributionCard
                  simulationInfo={simulationInfo}
                  primaryPercentile={primaryPercentile}
                  title={field.name}
                  icon={field.icon}
                  units={field.units}
                  color={field.color}
                  cardProps={{ style: { marginBottom: '16px' } }}
                />
              </Col>
            );
          })}
        </Row>
      </Spin>
    </div>
  );
};

export default DistributionAnalysis;