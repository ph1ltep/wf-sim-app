// src/components/results/Overview.jsx
import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, Statistic, Divider, Tabs, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const formatCurrency = (value) => {
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
};

const Overview = () => {
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
  if (!results || !results.finalResults) {
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
  const irr = results.finalResults.IRR;
  const npv = results.finalResults.NPV;
  const minDSCR = results.finalResults.minDSCR;
  const projectLife = parameters?.general?.projectLife || 20;
  
  // Get annual data for charts
  const years = Array.from({ length: projectLife }, (_, i) => i + 1);
  const costs = results.intermediateData?.annualCosts?.total?.[pLabels.primary] || Array(projectLife).fill(0);
  const revenues = results.intermediateData?.annualRevenue?.[pLabels.primary] || Array(projectLife).fill(0);
  
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
                y: revenues.map((rev, i) => rev - costs[i]),
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
              title={`${pLabels.primary} IRR`}
              value={irr?.[pLabels.primary]}
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
              title={`${pLabels.primary} NPV`}
              value={npv?.[pLabels.primary]}
              precision={0}
              valueStyle={{ color: npv?.[pLabels.primary] >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<DollarOutlined />}
              formatter={formatCurrency}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`${pLabels.primary} Minimum DSCR`}
              value={minDSCR?.[pLabels.primary]}
              precision={2}
              valueStyle={{ 
                color: minDSCR?.[pLabels.primary] >= 1.3 ? '#3f8600' : 
                      (minDSCR?.[pLabels.primary] >= 1 ? '#cf9700' : '#cf1322') 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="DSCR Below 1 Probability"
              value={results.finalResults.probabilityOfDSCRBelow1 * 100 || 0}
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