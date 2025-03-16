// src/components/results/Overview.jsx
import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, Statistic, Divider, Tabs, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;

const formatCurrency = (value) => {
  if (!value) return '$0';
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
};

const Overview = () => {
  const { scenarioData, loading } = useScenario();
  
  // Check if simulation results are loaded
  const simulationResults = scenarioData?.simulation?.outputSim;
  const inputSim = scenarioData?.simulation?.inputSim;
  const parameters = scenarioData?.settings;
  
  // Extract percentile information
  const percentiles = useMemo(() => {
    if (parameters?.simulation?.probabilities) {
      return parameters.simulation.probabilities;
    }
    
    return {
      primary: 50,
      upperBound: 75,
      lowerBound: 25,
      extremeUpper: 90,
      extremeLower: 10
    };
  }, [parameters]);
  
  // Generate P-labels for accessing results
  const percentileMapping = useMemo(() => {
    return {
      primary: 'Pprimary',
      upper: 'Pupper_bound',
      lower: 'Plower_bound',
      extremeUpper: 'Pextreme_upper',
      extremeLower: 'Pextreme_lower'
    };
  }, []);
  
  // Check if we have results
  if (loading) {
    return (
      <div>
        <Title level={2}>Dashboard Overview</Title>
        <div>Loading simulation results...</div>
      </div>
    );
  }
  
  if (!simulationResults) {
    return (
      <div>
        <Title level={2}>Dashboard Overview</Title>
        <Empty 
          description="No simulation results available. Please run a simulation first." 
          style={{ margin: '50px 0' }}
        />
      </div>
    );
  }

  // Extract key metrics using the percentile labels
  const irr = simulationResults.IRR || {};
  const npv = simulationResults.NPV || {};
  const minDSCR = simulationResults.minDSCR || {};
  const projectLife = parameters?.general?.projectLife || 20;
  
  // DSCR below 1 probability (may not be available in all simulations)
  const dscrBelow1Probability = simulationResults.dscrBelow1Probability || 0;
  
  // Get annual data for charts from inputSim
  const years = Array.from({ length: projectLife }, (_, i) => i + 1);
  
  // Get costs from inputSim if available
  const costs = inputSim?.cashflow?.annualCosts?.total?.[percentileMapping.primary] || 
                Array(projectLife).fill(0);
  
  // Get revenues from inputSim if available
  const revenues = inputSim?.cashflow?.annualRevenue?.[percentileMapping.primary] || 
                  Array(projectLife).fill(0);
  
  // Calculate net cash flow if not directly available
  const netCashFlow = inputSim?.cashflow?.netCashFlow?.[percentileMapping.primary] || 
                      revenues.map((rev, i) => rev - costs[i]);
  
  // Define tab items
  const tabItems = [
    {
      key: 'cashflow',
      label: 'Cash Flow Overview',
      children: (
        <Card>
          <Plot
            data={[
              {
                x: years,
                y: revenues,
                type: 'bar',
                name: 'Revenue',
                marker: { color: 'rgba(55, 128, 191, 0.7)' }
              },
              {
                x: years,
                y: costs.map(cost => -cost),
                type: 'bar',
                name: 'Costs',
                marker: { color: 'rgba(219, 64, 82, 0.7)' }
              },
              {
                x: years,
                y: netCashFlow,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Net Cash Flow',
                line: { color: 'green', width: 3 }
              }
            ]}
            layout={{
              title: 'Annual Cash Flow Overview',
              barmode: 'relative',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'USD' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        </Card>
      )
    },
    {
      key: 'irr',
      label: 'IRR Sensitivity',
      children: (
        <Card>
          <p>IRR sensitivity analysis will be implemented in a future version.</p>
        </Card>
      )
    },
    {
      key: 'risk',
      label: 'Risk Analysis',
      children: (
        <Card>
          <p>Risk analysis visualization will be implemented in a future version.</p>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Dashboard Overview</Title>
      
      {/* Key Metrics */}
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <Card>
            <Statistic
              title={`P${percentiles.primary} IRR`}
              value={irr[percentileMapping.primary]}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`P${percentiles.primary} NPV`}
              value={npv[percentileMapping.primary]}
              precision={0}
              valueStyle={{ color: npv[percentileMapping.primary] >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<DollarOutlined />}
              formatter={formatCurrency}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`P${percentiles.primary} Minimum DSCR`}
              value={minDSCR[percentileMapping.primary]}
              precision={2}
              valueStyle={{ 
                color: minDSCR[percentileMapping.primary] >= 1.3 ? '#3f8600' : 
                      (minDSCR[percentileMapping.primary] >= 1 ? '#cf9700' : '#cf1322') 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="DSCR Below 1 Probability"
              value={dscrBelow1Probability * 100}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>
      
      {/* P-value Reference */}
      <Card style={{ marginTop: 20, marginBottom: 20 }}>
        <Title level={4}>Percentile Reference</Title>
        <p>
          The results shown use the following percentiles from your simulation settings:
        </p>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic title="Primary" value={`P${percentiles.primary}`} />
          </Col>
          <Col span={4}>
            <Statistic title="Upper Bound" value={`P${percentiles.upperBound}`} />
          </Col>
          <Col span={4}>
            <Statistic title="Lower Bound" value={`P${percentiles.lowerBound}`} />
          </Col>
          <Col span={4}>
            <Statistic title="Extreme Upper" value={`P${percentiles.extremeUpper}`} />
          </Col>
          <Col span={4}>
            <Statistic title="Extreme Lower" value={`P${percentiles.extremeLower}`} />
          </Col>
        </Row>
      </Card>
      
      <Divider />
      
      {/* Charts */}
      <Tabs defaultActiveKey="cashflow" items={tabItems} />
    </div>
  );
};

export default Overview;