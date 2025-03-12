// src/components/results/CostBreakdown.jsx
import React from 'react';
import { Typography, Card, Row, Col, Radio } from 'antd';
import Plot from 'react-plotly.js';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const CostBreakdown = () => {
  const { results } = useSimulation();
  const [viewType, setViewType] = React.useState('stacked');
  
  // Check if we have results
  if (!results || !results.intermediateData || !results.intermediateData.annualCosts) {
    return (
      <div>
        <Title level={2}>Cost Breakdown Analysis</Title>
        <p>No simulation results available. Please run a simulation first.</p>
      </div>
    );
  }

  // Extract data from results
  const { annualCosts } = results.intermediateData;
  const years = Array.from({ length: annualCosts.total.P50.length }, (_, i) => i + 1);
  
  // Extract cost components
  const baseOMCosts = annualCosts.components?.baseOM?.P50 || Array(years.length).fill(0);
  const failureRiskCosts = annualCosts.components?.failureRisk?.P50 || Array(years.length).fill(0);
  const majorRepairCosts = annualCosts.components?.majorRepairs?.P50 || Array(years.length).fill(0);
  
  // Calculate total costs if not directly available
  const totalCosts = annualCosts.total.P50;
  
  const handleViewChange = (e) => {
    setViewType(e.target.value);
  };

  return (
    <div>
      <Title level={2}>Cost Breakdown Analysis</Title>
      
      <Card>
        <Row justify="end" style={{ marginBottom: 16 }}>
          <Col>
            <Radio.Group value={viewType} onChange={handleViewChange}>
              <Radio.Button value="stacked">Stacked</Radio.Button>
              <Radio.Button value="components">Components</Radio.Button>
              <Radio.Button value="percentiles">Percentiles</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
        
        {viewType === 'stacked' && (
          <Plot
            data={[
              {
                x: years,
                y: baseOMCosts,
                type: 'bar',
                name: 'Base O&M Costs',
                marker: { color: 'rgba(55, 128, 191, 0.7)' }
              },
              {
                x: years,
                y: failureRiskCosts,
                type: 'bar',
                name: 'Failure Risk Costs',
                marker: { color: 'rgba(219, 64, 82, 0.7)' }
              },
              {
                x: years,
                y: majorRepairCosts,
                type: 'bar',
                name: 'Major Repair Costs',
                marker: { color: 'rgba(153, 102, 255, 0.7)' }
              }
            ]}
            layout={{
              title: 'Annual Cost Breakdown',
              barmode: 'stack',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Cost (USD)' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        )}
        
        {viewType === 'components' && (
          <Plot
            data={[
              {
                x: years,
                y: baseOMCosts,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Base O&M Costs',
                line: { width: 2 }
              },
              {
                x: years,
                y: failureRiskCosts,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Failure Risk Costs',
                line: { width: 2 }
              },
              {
                x: years,
                y: majorRepairCosts,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Major Repair Costs',
                line: { width: 2 }
              }
            ]}
            layout={{
              title: 'Cost Components Over Time',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Cost (USD)' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        )}
        
        {viewType === 'percentiles' && (
          <Plot
            data={[
              {
                x: years,
                y: annualCosts.total.P50,
                type: 'scatter',
                mode: 'lines',
                name: 'P50 (Median)',
                line: { color: 'rgb(31, 119, 180)', width: 2 }
              },
              {
                x: years,
                y: annualCosts.total.P75,
                type: 'scatter',
                mode: 'lines',
                name: 'P75',
                line: { color: 'rgb(255, 127, 14)', width: 2, dash: 'dash' }
              },
              {
                x: years,
                y: annualCosts.total.P90,
                type: 'scatter',
                mode: 'lines',
                name: 'P90',
                line: { color: 'rgb(214, 39, 40)', width: 2, dash: 'dot' }
              }
            ]}
            layout={{
              title: 'Cost Percentiles Over Time',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Cost (USD)' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        )}
      </Card>
    </div>
  );
};

export default CostBreakdown;