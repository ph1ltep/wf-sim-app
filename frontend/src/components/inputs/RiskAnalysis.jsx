// src/components/inputs/RiskAnalysis.jsx
import React from 'react';
import { Typography, Card, Tabs, Table } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';
import Plot from 'react-plotly.js';

const { Title } = Typography;

const RiskAnalysis = () => {
  const { parameters } = useSimulation();
  
  // Check if parameters are loaded
  if (!parameters) {
    return <div>Loading parameters...</div>;
  }

  const projectLife = parameters.general?.projectLife || 20;
  const years = Array.from({ length: projectLife }, (_, i) => i + 1);
  
  // Generate some sample data for the risk analysis
  const failureProbability = parameters.cost?.failureEventProbability || 5;
  
  // Create failure rate data
  const failureRates = years.map(() => failureProbability + (Math.random() * 2 - 1)); // Random variation around the base rate
  
  // Create event data
  const eventData = [];
  const eventTypes = ['Turbine Failure', 'Gearbox Issue', 'Blade Damage', 'Electrical System', 'Control System'];
  
  for (let i = 0; i < 10; i++) {
    eventData.push({
      key: i,
      year: Math.floor(Math.random() * projectLife) + 1,
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      probability: (Math.random() * 10).toFixed(2),
      impact: Math.floor(Math.random() * 500000) + 100000,
      mitigation: Math.random() > 0.5 ? 'Insurance' : 'Reserve Funds'
    });
  }
  
  // Sort by year
  eventData.sort((a, b) => a.year - b.year);
  
  // Define the event table columns
  const eventColumns = [
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
    },
    {
      title: 'Probability (%)',
      dataIndex: 'probability',
      key: 'probability',
    },
    {
      title: 'Impact ($)',
      dataIndex: 'impact',
      key: 'impact',
      render: value => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    },
    {
      title: 'Mitigation',
      dataIndex: 'mitigation',
      key: 'mitigation',
    },
  ];

  // Define the tabs items
  const tabItems = [
    {
      key: 'failure',
      label: 'Failure Rates',
      children: (
        <Card>
          <Plot
            data={[
              {
                x: years,
                y: failureRates,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Failure Rate',
                line: { color: 'rgba(219, 64, 82, 0.7)', width: 2 }
              },
              {
                x: years,
                y: Array(projectLife).fill(failureProbability),
                type: 'scatter',
                mode: 'lines',
                name: 'Baseline Probability',
                line: { color: 'rgba(0, 0, 0, 0.5)', width: 1, dash: 'dash' }
              }
            ]}
            layout={{
              title: 'Projected Failure Rates Over Time',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Failure Rate (%)' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        </Card>
      )
    },
    {
      key: 'events',
      label: 'Risk Events',
      children: (
        <Card>
          <Table 
            columns={eventColumns} 
            dataSource={eventData} 
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Card>
      )
    },
    {
      key: 'matrix',
      label: 'Risk Matrix',
      children: (
        <Card>
          <Plot
            data={[
              {
                x: eventData.map(e => e.probability),
                y: eventData.map(e => e.impact),
                mode: 'markers',
                type: 'scatter',
                text: eventData.map(e => `${e.eventType} (Year ${e.year})`),
                marker: {
                  size: 12,
                  color: eventData.map(e => {
                    const p = parseFloat(e.probability);
                    const i = e.impact / 1000000;
                    // Color based on risk level (probability * impact)
                    const risk = p * i;
                    if (risk > 5) return 'rgba(219, 64, 82, 0.7)'; // High risk
                    if (risk > 2) return 'rgba(255, 165, 0, 0.7)'; // Medium risk
                    return 'rgba(46, 139, 87, 0.7)'; // Low risk
                  })
                }
              }
            ]}
            layout={{
              title: 'Risk Matrix: Probability vs Impact',
              xaxis: { 
                title: 'Probability (%)',
                range: [0, 12]
              },
              yaxis: { 
                title: 'Impact ($)',
                range: [0, 600000]
              },
              height: 500,
              shapes: [
                // Low risk zone
                {
                  type: 'rect',
                  x0: 0, y0: 0,
                  x1: 5, y1: 200000,
                  fillcolor: 'rgba(46, 139, 87, 0.1)',
                  line: { width: 0 }
                },
                // Medium risk zone
                {
                  type: 'rect',
                  x0: 0, y0: 200000,
                  x1: 7, y1: 400000,
                  fillcolor: 'rgba(255, 165, 0, 0.1)',
                  line: { width: 0 }
                },
                // High risk zone
                {
                  type: 'rect',
                  x0: 7, y0: 0,
                  x1: 12, y1: 600000,
                  fillcolor: 'rgba(219, 64, 82, 0.1)',
                  line: { width: 0 }
                }
              ]
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Risk Analysis</Title>
      <p>Analyze potential risks, failure rates, and their impact on the wind farm project.</p>
      
      <Tabs defaultActiveKey="failure" items={tabItems} />
    </div>
  );
};

export default RiskAnalysis;