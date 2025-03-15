// src/components/results/IRRDistribution.jsx
import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, Statistic, Empty, Alert } from 'antd';
import Plot from 'react-plotly.js';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const IRRDistribution = () => {
  const { results, parameters } = useSimulation();
  
  // Extract percentile information
  const percentiles = useMemo(() => {
    if (results?.percentileInfo) {
      return results.percentileInfo;
    }
    
    // Fallback to parameters if available, or use defaults
    if (parameters?.probabilities) {
      return parameters.probabilities;
    }
    
    return {
      primary: 50,
      upperBound: 75,
      lowerBound: 25,
      extremeUpper: 90,
      extremeLower: 10
    };
  }, [results, parameters]);
  
  // Generate P-labels for accessing results
  const pLabels = useMemo(() => {
    return {
      primary: `P${percentiles.primary}`,
      upper: `P${percentiles.upperBound}`,
      lower: `P${percentiles.lowerBound}`,
      extremeUpper: `P${percentiles.extremeUpper}`,
      extremeLower: `P${percentiles.extremeLower}`
    };
  }, [percentiles]);
  
  // Check if we have results
  if (!results || !results.finalResults || !results.finalResults.IRR) {
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
  const irrResults = results.finalResults.IRR;
  
  // Create mock histogram data (since we don't have the raw distribution, just percentiles)
  // In a real implementation, we'd use actual histogram data from the backend
  const primary = irrResults[pLabels.primary] || 0;
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
        description={`This analysis uses the percentiles you've configured in Simulation Settings: Primary (${pLabels.primary}), Upper Bound (${pLabels.upper}), and Extreme Upper (${pLabels.extremeUpper}).`}
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
                  x: [irrResults[pLabels.primary], irrResults[pLabels.primary]],
                  y: [0, 55],
                  line: { color: 'green', width: 2, dash: 'dash' },
                  name: pLabels.primary
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [irrResults[pLabels.upper], irrResults[pLabels.upper]],
                  y: [0, 55],
                  line: { color: 'orange', width: 2, dash: 'dash' },
                  name: pLabels.upper
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [irrResults[pLabels.extremeUpper], irrResults[pLabels.extremeUpper]],
                  y: [0, 55],
                  line: { color: 'red', width: 2, dash: 'dash' },
                  name: pLabels.extremeUpper
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
              title={`${pLabels.primary} IRR`}
              value={irrResults[pLabels.primary]}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="%"
            />
            <p>{percentiles.primary}% chance of achieving this IRR or better</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={`${pLabels.upper} IRR`}
              value={irrResults[pLabels.upper]}
              precision={2}
              valueStyle={{ color: '#cf9700' }}
              suffix="%"
            />
            <p>{percentiles.upperBound}% chance of achieving this IRR or better</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={`${pLabels.extremeUpper} IRR`}
              value={irrResults[pLabels.extremeUpper]}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="%"
            />
            <p>{percentiles.extremeUpper}% chance of achieving this IRR or better</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IRRDistribution;