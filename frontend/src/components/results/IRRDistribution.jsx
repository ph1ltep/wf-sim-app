// src/components/results/IRRDistribution.jsx
import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, Statistic, Empty, Alert } from 'antd';
import Plot from 'react-plotly.js';
import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;

const IRRDistribution = () => {
  const { scenarioData, loading } = useScenario();
  
  // Check if simulation results are loaded
  const simulationResults = scenarioData?.simulation?.outputSim;
  const percentiles = scenarioData?.settings?.simulation?.probabilities;
  
  // Get percentile mappings
  const percentileMapping = useMemo(() => {
    if (!percentiles) return {
      primary: 'Pprimary',
      upper: 'Pupper_bound',
      lower: 'Plower_bound',
      extremeUpper: 'Pextreme_upper',
      extremeLower: 'Pextreme_lower'
    };
    
    return {
      primary: `Pprimary`,
      upper: `Pupper_bound`,
      lower: `Plower_bound`,
      extremeUpper: `Pextreme_upper`,
      extremeLower: `Pextreme_lower`
    };
  }, [percentiles]);
  
  // Get percentile values
  const percentileValues = useMemo(() => {
    if (!percentiles) return {
      primary: 50,
      upper: 75,
      lower: 25,
      extremeUpper: 90,
      extremeLower: 10
    };
    
    return {
      primary: percentiles.primary || 50,
      upper: percentiles.upperBound || 75,
      lower: percentiles.lowerBound || 25,
      extremeUpper: percentiles.extremeUpper || 90,
      extremeLower: percentiles.extremeLower || 10
    };
  }, [percentiles]);

  // Check if we have results
  if (loading) {
    return (
      <div>
        <Title level={2}>IRR Distribution Analysis</Title>
        <div>Loading IRR distribution data...</div>
      </div>
    );
  }
  
  if (!simulationResults || !simulationResults.IRR) {
    return (
      <div>
        <Title level={2}>IRR Distribution Analysis</Title>
        <Empty 
          description="No simulation results available. Please run a simulation first." 
          style={{ margin: '50px 0' }}
        />
      </div>
    );
  }

  // Extract IRR percentiles
  const irrResults = simulationResults.IRR;
  
  // Create mock histogram data (since we don't have the raw distribution, just percentiles)
  // In a real implementation, we'd use actual histogram data from the backend
  const primary = irrResults[percentileMapping.primary] || 0;
  const mockHistogramData = [
    { x: primary * 0.7, y: 5 },
    { x: primary * 0.8, y: 15 },
    { x: primary * 0.9, y: 25 },
    { x: primary * 0.95, y: 40 },
    { x: primary, y: 50 },
    { x: primary * 1.05, y: 40 },
    { x: primary * 1.1, y: 25 },
    { x: primary * 1.2, y: 15 },
    { x: primary * 1.3, y: 5 },
  ];

  return (
    <div>
      <Title level={2}>IRR Distribution Analysis</Title>
      
      <Alert
        message="Dynamic Percentiles"
        description={`This analysis uses the percentiles you've configured in Simulation Settings: Primary (P${percentileValues.primary}), Upper Bound (P${percentileValues.upper}), and Extreme Upper (P${percentileValues.extremeUpper}).`}
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />
      
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: mockHistogramData.map(d => d.x),
                  y: mockHistogramData.map(d => d.y),
                  marker: {
                    color: 'rgba(55, 128, 191, 0.7)',
                    line: {
                      color: 'rgba(55, 128, 191, 1.0)',
                      width: 1
                    }
                  },
                  name: 'IRR Distribution'
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [irrResults[percentileMapping.primary], irrResults[percentileMapping.primary]],
                  y: [0, 55],
                  line: { color: 'green', width: 2, dash: 'dash' },
                  name: `P${percentileValues.primary}`
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [irrResults[percentileMapping.upper], irrResults[percentileMapping.upper]],
                  y: [0, 55],
                  line: { color: 'orange', width: 2, dash: 'dash' },
                  name: `P${percentileValues.upper}`
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [irrResults[percentileMapping.extremeUpper], irrResults[percentileMapping.extremeUpper]],
                  y: [0, 55],
                  line: { color: 'red', width: 2, dash: 'dash' },
                  name: `P${percentileValues.extremeUpper}`
                }
              ]}
              layout={{
                title: 'IRR Distribution with Percentile Markers',
                xaxis: { 
                  title: 'IRR (%)',
                  tickformat: '.2%'
                },
                yaxis: { 
                  title: 'Frequency',
                  range: [0, 55]
                },
                height: 500,
                showlegend: true
              }}
              style={{ width: '100%' }}
              config={{ responsive: true }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={`P${percentileValues.primary} IRR`}
              value={irrResults[percentileMapping.primary]}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="%"
            />
            <p>{percentileValues.primary}% chance of achieving this IRR or better</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={`P${percentileValues.upper} IRR`}
              value={irrResults[percentileMapping.upper]}
              precision={2}
              valueStyle={{ color: '#cf9700' }}
              suffix="%"
            />
            <p>{percentileValues.upper}% chance of achieving this IRR or better</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={`P${percentileValues.extremeUpper} IRR`}
              value={irrResults[percentileMapping.extremeUpper]}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="%"
            />
            <p>{percentileValues.extremeUpper}% chance of achieving this IRR or better</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IRRDistribution;