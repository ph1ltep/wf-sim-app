// src/components/input/DistributionAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Space, Typography, Divider, Statistic, Empty, Spin, Button, message } from 'antd';
import { 
  LineChartOutlined, 
  ReloadOutlined,
  AreaChartOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { simulateDistributions } from '../../api/simulation';
import Plot from 'react-plotly.js';

const { Title, Text, Paragraph } = Typography;

// Helper function to generate sample data for a distribution simulation
const generateSampleData = (years = 20, percentiles) => {
  if (!percentiles || percentiles.length === 0) {
    return [];
  }

  // Create simulation results for each percentile
  return percentiles.map(percentile => {
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
};

// Helper function to prepare Plotly data from simulation results
const prepareChartData = (results, primaryPercentile, baseColor) => {
  if (!results || results.length === 0) return { data: [], layout: {} };
  
  // Sort percentiles in ascending order
  const sortedResults = [...results].sort((a, b) => a.percentile.value - b.percentile.value);
  
  // Plotly traces for each percentile
  const traces = [];
  
  // Find specific percentiles for area fills
  const extremeLower = sortedResults.find(r => r.percentile.description === 'extreme_lower');
  const extremeUpper = sortedResults.find(r => r.percentile.description === 'extreme_upper');
  const lowerBound = sortedResults.find(r => r.percentile.description === 'lower_bound');
  const upperBound = sortedResults.find(r => r.percentile.description === 'upper_bound');
  const primary = sortedResults.find(r => r.percentile.value === primaryPercentile);
  
  // Add extreme area (if available)
  if (extremeLower && extremeUpper) {
    // Lower extreme area
    traces.push({
      x: extremeLower.data.map(d => d.year),
      y: extremeLower.data.map(d => d.value),
      name: `P${extremeLower.percentile.value} (Extreme Lower)`,
      line: { color: baseColor, width: 0 },
      showlegend: false,
      hoverinfo: 'skip'
    });
    
    // Upper extreme area
    traces.push({
      x: extremeUpper.data.map(d => d.year),
      y: extremeUpper.data.map(d => d.value),
      name: `P${extremeUpper.percentile.value} (Extreme Upper)`,
      fill: 'tonexty',
      fillcolor: `rgba(${hexToRgb(baseColor)}, 0.1)`,
      line: { color: baseColor, width: 0 },
      showlegend: true,
      hoverinfo: 'x+y',
      hoverlabel: { namelength: -1 }
    });
  }
  
  // Add standard bounds area (if available)
  if (lowerBound && upperBound) {
    // Lower bound
    traces.push({
      x: lowerBound.data.map(d => d.year),
      y: lowerBound.data.map(d => d.value),
      name: `P${lowerBound.percentile.value} (Lower Bound)`,
      line: { color: baseColor, width: 0 },
      showlegend: false,
      hoverinfo: 'skip'
    });
    
    // Upper bound
    traces.push({
      x: upperBound.data.map(d => d.year),
      y: upperBound.data.map(d => d.value),
      name: `P${upperBound.percentile.value}-P${lowerBound.percentile.value} Band`,
      fill: 'tonexty',
      fillcolor: `rgba(${hexToRgb(baseColor)}, 0.3)`,
      line: { color: baseColor, width: 0 },
      showlegend: true,
      hoverinfo: 'x+y',
      hoverlabel: { namelength: -1 }
    });
  }
  
  // Add primary percentile line
  if (primary) {
    traces.push({
      x: primary.data.map(d => d.year),
      y: primary.data.map(d => d.value),
      name: `P${primary.percentile.value} (Primary)`,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: baseColor, width: 3 },
      marker: { size: 6, color: baseColor },
      hoverinfo: 'x+y',
      hoverlabel: { namelength: -1 }
    });
  }
  
  // Base layout for the plot
  const layout = {
    autosize: true,
    height: 300,
    margin: { l: 50, r: 30, t: 10, b: 40 },
    xaxis: {
      title: 'Year',
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      zeroline: false,
      showgrid: true
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: -0.2,
      xanchor: 'center',
      x: 0.5
    },
    hovermode: 'closest'
  };
  
  // Configuration options
  const config = {
    responsive: true,
    displayModeBar: false
  };
  
  return { data: traces, layout, config };
};

// Helper function to convert hex color to rgb format for rgba
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

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
      addonAfter: 'MWh',
      color: '#1890ff'
    },
    {
      name: 'Electricity Price',
      path: ['settings', 'modules', 'revenue', 'electricityPrice'],
      icon: <DollarOutlined style={{ color: '#52c41a' }} />,
      addonAfter: '$/MWh',
      color: '#52c41a'
    },
    {
      name: 'Downtime Per Event',
      path: ['settings', 'modules', 'revenue', 'downtimePerEvent'],
      icon: <FieldTimeOutlined style={{ color: '#faad14' }} />,
      addonAfter: 'hours',
      color: '#faad14'
    },
    {
      name: 'Wind Variability',
      path: ['settings', 'modules', 'revenue', 'windVariability'],
      icon: <AreaChartOutlined style={{ color: '#eb2f96' }} />,
      addonAfter: 'm/s',
      color: '#eb2f96'
    }
  ];

  // Function to get simulation results for a distribution
  const getDistributionResults = (path) => {
    // Check if we have results in our state first
    const pathKey = path.join('.');
    if (simulationResults[pathKey] && simulationResults[pathKey].length > 0) {
      return simulationResults[pathKey];
    }
    
    // Try to get actual results from the scenario
    const actualResults = getValueByPath([...path, 'data'], []);
    
    // If we have actual results, use them
    if (actualResults && actualResults.length > 0) {
      return actualResults;
    }
    
    // Otherwise, generate sample data
    return generateSampleData(projectYears, percentiles);
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
            newResults[pathKey] = info.results;
            
            // Update the scenario context with the results
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
          <Text>No active scenario. Please create or load a scenario first.</Text>
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
            const results = getDistributionResults(field.path);
            const distribution = getValueByPath([...field.path, 'distribution'], {});
            const { data, layout, config } = prepareChartData(results, primaryPercentile, field.color);
            
            // Customize layout for each field
            const customizedLayout = {
              ...layout,
              yaxis: {
                ...layout.yaxis,
                title: field.addonAfter
              }
            };
            
            return (
              <Col span={12} key={index}>
                <Card 
                  title={
                    <Space>
                      {field.icon}
                      {field.name}
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({distribution.type?.charAt(0).toUpperCase() + distribution.type?.slice(1) || 'Unknown'})
                      </Text>
                    </Space>
                  } 
                  bordered={true}
                  style={{ marginBottom: '16px' }}
                >
                  {results && results.length > 0 ? (
                    <>
                      <Plot
                        data={data}
                        layout={customizedLayout}
                        config={config}
                        style={{ width: '100%' }}
                      />
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      {/* Display first year values for quick reference */}
                      <Row gutter={16}>
                        {percentiles.map((p, i) => {
                          const result = results.find(r => r.percentile.value === p.value);
                          const firstYearValue = result?.data[0]?.value;
                          
                          return (
                            <Col span={8} key={i}>
                              <Statistic 
                                title={`P${p.value}`}
                                value={firstYearValue !== undefined ? firstYearValue.toFixed(2) : 'N/A'}
                                suffix={field.addonAfter}
                                valueStyle={{ 
                                  color: p.value === primaryPercentile ? field.color : 'inherit',
                                  fontWeight: p.value === primaryPercentile ? 'bold' : 'normal',
                                  fontSize: '16px'
                                }}
                              />
                            </Col>
                          );
                        })}
                      </Row>
                    </>
                  ) : (
                    <Empty 
                      description="No simulation results available" 
                      style={{ padding: '40px 0' }}
                    />
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Spin>
    </div>
  );
};

export default DistributionAnalysis;