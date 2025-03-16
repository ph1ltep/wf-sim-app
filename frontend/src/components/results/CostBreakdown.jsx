// src/components/results/CostBreakdown.jsx
import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, Radio, Empty, Alert } from 'antd';
import Plot from 'react-plotly.js';
import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;

const CostBreakdown = () => {
  const { scenarioData, loading } = useScenario();
  const [viewType, setViewType] = React.useState('stacked');
  
  // Check if simulation results are loaded
  const simulationResults = scenarioData?.simulation?.inputSim;
  
  // Extract percentile information
  const percentiles = useMemo(() => {
    if (scenarioData?.settings?.simulation?.probabilities) {
      return scenarioData.settings.simulation.probabilities;
    }
    
    return {
      primary: 50,
      upperBound: 75,
      lowerBound: 25,
      extremeUpper: 90,
      extremeLower: 10
    };
  }, [scenarioData]);
  
  // Generate P-labels for accessing results
  const pLabels = useMemo(() => {
    return {
      primary: `Pprimary`,
      upper: `Pupper_bound`,
      lower: `Plower_bound`,
      extremeUpper: `Pextreme_upper`,
      extremeLower: `Pextreme_lower`
    };
  }, []);
  
  // Check if we have results
  if (loading) {
    return (
      <div>
        <Title level={2}>Cost Breakdown Analysis</Title>
        <div>Loading cost breakdown data...</div>
      </div>
    );
  }
  
  if (!simulationResults || !simulationResults.cashflow || !simulationResults.cashflow.annualCosts) {
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
  const { annualCosts } = simulationResults.cashflow;
  const projectLife = scenarioData?.settings?.general?.projectLife || 20;
  const years = Array.from({ length: projectLife }, (_, i) => i + 1);
  
  // Extract cost components - use optional chaining to handle missing data gracefully
  const baseOMCosts = annualCosts.components?.baseOM?.[pLabels.primary] || Array(years.length).fill(0);
  const failureRiskCosts = annualCosts.components?.failureRisk?.[pLabels.primary] || Array(years.length).fill(0);
  const majorRepairCosts = annualCosts.components?.majorRepairs?.[pLabels.primary] || Array(years.length).fill(0);
  const contingencyCosts = annualCosts.components?.contingency?.[pLabels.primary] || Array(years.length).fill(0);
  
  // Calculate total costs if not available directly
  const totalCosts = annualCosts.total?.[pLabels.primary] || 
    years.map((_, i) => {
      return (baseOMCosts[i] || 0) + 
             (failureRiskCosts[i] || 0) + 
             (majorRepairCosts[i] || 0) + 
             (contingencyCosts[i] || 0);
    });
  
  const handleViewChange = (e) => {
    setViewType(e.target.value);
  };

  return (
    <div>
      <Title level={2}>Cost Breakdown Analysis</Title>
      
      <Alert
        message="Dynamic Percentiles"
        description={`This analysis uses the percentiles you've configured in Simulation Settings: Primary (P${percentiles.primary}), Upper Bound (P${percentiles.upperBound}), and Extreme Upper (P${percentiles.extremeUpper}).`}
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
              },
              {
                x: years,
                y: contingencyCosts,
                type: 'bar',
                name: 'Contingency Costs',
                marker: { color: 'rgba(255, 159, 64, 0.7)' }
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
              },
              {
                x: years,
                y: contingencyCosts,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Contingency Costs',
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
                name: `P${percentiles.primary} (Primary)`,
                line: { color: 'rgb(31, 119, 180)', width: 2 }
              },
              {
                x: years,
                y: annualCosts.total[pLabels.upper],
                type: 'scatter',
                mode: 'lines',
                name: `P${percentiles.upperBound}`,
                line: { color: 'rgb(255, 127, 14)', width: 2, dash: 'dash' }
              },
              {
                x: years,
                y: annualCosts.total[pLabels.extremeUpper],
                type: 'scatter',
                mode: 'lines',
                name: `P${percentiles.extremeUpper}`,
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