// src/components/results/CostBreakdown.jsx
import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, Radio, Empty, Alert } from 'antd';
import Plot from 'react-plotly.js';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const CostBreakdown = () => {
  const { results, parameters } = useSimulation();
  const [viewType, setViewType] = React.useState('stacked');
  
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
  if (!results || !results.intermediateData || !results.intermediateData.annualCosts) {
    return (
      <div>
        <Title level={2}>Cost Breakdown Analysis</Title>
        <Empty 
          description="No simulation results available. Please run a simulation first." 
          style={{ margin: '50px 0' }}
        />
      </div>
    );
  }

  // Extract data from results using dynamic percentile labels
  const { annualCosts } = results.intermediateData;
  const years = Array.from({ length: annualCosts.total[pLabels.primary].length }, (_, i) => i + 1);
  
  // Extract cost components - use optional chaining to handle missing data gracefully
  const baseOMCosts = annualCosts.components?.baseOM?.[pLabels.primary] || Array(years.length).fill(0);
  const failureRiskCosts = annualCosts.components?.failureRisk?.[pLabels.primary] || Array(years.length).fill(0);
  const majorRepairCosts = annualCosts.components?.majorRepairs?.[pLabels.primary] || Array(years.length).fill(0);
  
  // Calculate total costs
  const totalCosts = annualCosts.total[pLabels.primary];
  
  const handleViewChange = (e) => {
    setViewType(e.target.value);
  };

  return (
    <div>
      <Title level={2}>Cost Breakdown Analysis</Title>
      
      <Alert
        message="Dynamic Percentiles"
        description={`This analysis uses the percentiles you've configured in Simulation Settings: Primary (${pLabels.primary}), Upper Bound (${pLabels.upper}), and Extreme (${pLabels.extremeUpper}).`}
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />
      
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
                y: annualCosts.total[pLabels.primary],
                type: 'scatter',
                mode: 'lines',
                name: `${pLabels.primary} (Primary)`,
                line: { color: 'rgb(31, 119, 180)', width: 2 }
              },
              {
                x: years,
                y: annualCosts.total[pLabels.upper],
                type: 'scatter',
                mode: 'lines',
                name: pLabels.upper,
                line: { color: 'rgb(255, 127, 14)', width: 2, dash: 'dash' }
              },
              {
                x: years,
                y: annualCosts.total[pLabels.extremeUpper],
                type: 'scatter',
                mode: 'lines',
                name: pLabels.extremeUpper,
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