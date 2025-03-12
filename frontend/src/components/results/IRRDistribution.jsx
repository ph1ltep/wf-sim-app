// src/components/results/IRRDistribution.jsx
import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import Plot from 'react-plotly.js';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const IRRDistribution = () => {
  const { results } = useSimulation();
  
  // Check if we have results
  if (!results || !results.finalResults || !results.finalResults.IRR) {
    return (
      <div>
        <Title level={2}>IRR Distribution Analysis</Title>
        <p>No simulation results available. Please run a simulation first.</p>
      </div>
    );
  }

  // Extract IRR percentiles
  const { P50, P75, P90 } = results.finalResults.IRR;
  
  // Create mock histogram data (since we don't have the raw distribution, just percentiles)
  // In a real implementation, we'd use actual histogram data from the backend
  const mockHistogramData = [
    { x: P50 * 0.7, y: 5 },
    { x: P50 * 0.8, y: 15 },
    { x: P50 * 0.9, y: 25 },
    { x: P50 * 0.95, y: 40 },
    { x: P50, y: 50 },
    { x: P50 * 1.05, y: 40 },
    { x: P50 * 1.1, y: 25 },
    { x: P50 * 1.2, y: 15 },
    { x: P50 * 1.3, y: 5 },
  ];

  return (
    <div>
      <Title level={2}>IRR Distribution Analysis</Title>
      
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
                  x: [P50, P50],
                  y: [0, 55],
                  line: { color: 'green', width: 2, dash: 'dash' },
                  name: 'P50'
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [P75, P75],
                  y: [0, 55],
                  line: { color: 'orange', width: 2, dash: 'dash' },
                  name: 'P75'
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: [P90, P90],
                  y: [0, 55],
                  line: { color: 'red', width: 2, dash: 'dash' },
                  name: 'P90'
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
              title="P50 (Median) IRR"
              value={P50}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="%"
            />
            <p>50% chance of achieving this IRR or better</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="P75 IRR"
              value={P75}
              precision={2}
              valueStyle={{ color: '#cf9700' }}
              suffix="%"
            />
            <p>75% chance of achieving this IRR or better</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="P90 IRR"
              value={P90}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="%"
            />
            <p>90% chance of achieving this IRR or better</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IRRDistribution;