// src/components/inputs/CashflowAnalysis.jsx
import React from 'react';
import { Typography, Card, Tabs } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';
import Plot from 'react-plotly.js';

const { Title } = Typography;

const CashflowAnalysis = () => {
  const { parameters, results } = useSimulation();
  
  // Check if parameters are loaded
  if (!parameters) {
    return <div>Loading parameters...</div>;
  }

  const projectLife = parameters.general?.projectLife || 20;
  const years = Array.from({ length: projectLife }, (_, i) => i + 1);
  
  // Generate cost breakdown data
  // If we have results from simulation, use them, otherwise generate mock data
  let baseOMCosts = [];
  let failureEventCosts = [];
  let majorRepairCosts = [];
  let oemCosts = [];
  let contingencyCosts = [];
  let totalCosts = [];
  
  if (results?.intermediateData?.annualCosts?.components) {
    // Use real data if available
    const costData = results.intermediateData.annualCosts;
    baseOMCosts = costData.components.baseOM?.P50 || Array(projectLife).fill(0);
    failureEventCosts = costData.components.failureRisk?.P50 || Array(projectLife).fill(0);
    majorRepairCosts = costData.components.majorRepairs?.P50 || Array(projectLife).fill(0);
    totalCosts = costData.total.P50 || Array(projectLife).fill(0);
    
    // Calculate OEM costs and contingency as the remainder if not directly available
    oemCosts = Array(projectLife).fill(0);
    contingencyCosts = Array(projectLife).fill(0);
    
    // Generate a remainder to account for any difference between total and components
    const remainder = years.map((_, i) => {
      return totalCosts[i] - (baseOMCosts[i] + failureEventCosts[i] + majorRepairCosts[i]);
    });
    
    // Distribute the remainder between OEM and contingency
    for (let i = 0; i < projectLife; i++) {
      if (remainder[i] > 0) {
        if (i < (parameters.cost?.oemTerm || 5)) {
          oemCosts[i] = remainder[i];
        } else {
          contingencyCosts[i] = remainder[i];
        }
      }
    }
  } else {
    // Generate mock data
    const baseAnnualOM = parameters.cost?.annualBaseOM || 5000000;
    const oemTerm = parameters.cost?.oemTerm || 5;
    const fixedOMFee = parameters.cost?.fixedOMFee || 4000000;
    
    for (let i = 0; i < projectLife; i++) {
      const year = i + 1;
      
      // Base O&M costs (with escalation)
      const escalationRate = (parameters.cost?.escalationRate || 2) / 100;
      baseOMCosts[i] = baseAnnualOM * Math.pow(1 + escalationRate, i);
      
      // OEM costs during OEM term
      oemCosts[i] = year <= oemTerm ? fixedOMFee : 0;
      
      // Failure costs (random variation based on probability)
      const failureProb = (parameters.cost?.failureEventProbability || 5) / 100;
      const failureCost = parameters.cost?.failureEventCost || 200000;
      failureEventCosts[i] = Math.random() < failureProb ? failureCost : 0;
      
      // Major repairs (more likely in later years)
      const majorRepairProb = 0.05 + (i / projectLife) * 0.15; // Increases with time
      majorRepairCosts[i] = Math.random() < majorRepairProb ? 500000 + Math.random() * 500000 : 0;
      
      // Contingency (small percentage of total)
      contingencyCosts[i] = (baseOMCosts[i] + oemCosts[i] + failureEventCosts[i] + majorRepairCosts[i]) * 0.05;
      
      // Total costs
      totalCosts[i] = baseOMCosts[i] + oemCosts[i] + failureEventCosts[i] + majorRepairCosts[i] + contingencyCosts[i];
    }
  }
  
  // Generate revenue data
  const revenues = results?.intermediateData?.annualRevenue?.P50 || 
    Array(projectLife).fill().map((_, i) => 8000000 - i * 50000); // Dummy data
  
  // Net cash flow
  const netCashFlow = years.map((_, i) => revenues[i] - totalCosts[i]);
  
  // Create sample data table
  const tableData = years.map((year, i) => ({
    year,
    baseOM: baseOMCosts[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    oem: oemCosts[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    failures: failureEventCosts[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    majorRepairs: majorRepairCosts[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    contingency: contingencyCosts[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    totalCost: totalCosts[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    revenue: revenues[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    netCashFlow: netCashFlow[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }));

  // Define tabs items
  const tabItems = [
    {
      key: 'costs',
      label: 'Costs',
      children: (
        <Card>
          <Plot
            data={[
              // Stacked bar chart components
              {
                x: years,
                y: baseOMCosts,
                type: 'bar',
                name: 'Base O&M',
                marker: { color: 'rgba(55, 128, 191, 0.7)' }
              },
              {
                x: years,
                y: oemCosts,
                type: 'bar',
                name: 'OEM Contract Costs',
                marker: { color: 'rgba(50, 171, 96, 0.7)' }
              },
              {
                x: years,
                y: failureEventCosts,
                type: 'bar',
                name: 'Failure Events',
                marker: { color: 'rgba(219, 64, 82, 0.7)' }
              },
              {
                x: years,
                y: majorRepairCosts,
                type: 'bar',
                name: 'Major Repairs',
                marker: { color: 'rgba(153, 102, 255, 0.7)' }
              },
              {
                x: years,
                y: contingencyCosts,
                type: 'bar',
                name: 'Contingency',
                marker: { color: 'rgba(255, 159, 64, 0.7)' }
              },
              // Line for total costs
              {
                x: years,
                y: totalCosts,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Total Cost',
                line: { color: 'rgba(0, 0, 0, 0.7)', width: 2 }
              }
            ]}
            layout={{
              title: 'Cost Breakdown by Category',
              barmode: 'stack',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Cost (USD)' },
              height: 500,
              legend: { 
                orientation: 'h', 
                y: -0.2 
              }
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        </Card>
      )
    },
    {
      key: 'revenue',
      label: 'Revenue',
      children: (
        <Card>
          <Plot
            data={[
              {
                x: years,
                y: revenues,
                type: 'bar',
                name: 'Annual Revenue',
                marker: { color: 'rgba(55, 128, 191, 0.7)' }
              }
            ]}
            layout={{
              title: 'Projected Annual Revenue',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Revenue (USD)' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        </Card>
      )
    },
    {
      key: 'netcash',
      label: 'Net Cash Flow',
      children: (
        <Card>
          <Plot
            data={[
              {
                x: years,
                y: netCashFlow,
                type: 'bar',
                name: 'Net Cash Flow',
                marker: { 
                  color: netCashFlow.map(value => value >= 0 ? 'rgba(55, 200, 113, 0.7)' : 'rgba(219, 64, 82, 0.7)')
                }
              }
            ]}
            layout={{
              title: 'Projected Net Cash Flow',
              xaxis: { title: 'Project Year' },
              yaxis: { title: 'Cash Flow (USD)' },
              height: 500,
            }}
            style={{ width: '100%' }}
            config={{ responsive: true }}
          />
        </Card>
      )
    },
    {
      key: 'data',
      label: 'Data Table',
      children: (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="cashflow-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableStyle.header}>Year</th>
                  <th style={tableStyle.header}>Base O&M</th>
                  <th style={tableStyle.header}>OEM Costs</th>
                  <th style={tableStyle.header}>Failures</th>
                  <th style={tableStyle.header}>Major Repairs</th>
                  <th style={tableStyle.header}>Contingency</th>
                  <th style={tableStyle.header}>Total Cost</th>
                  <th style={tableStyle.header}>Revenue</th>
                  <th style={tableStyle.header}>Net Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => (
                  <tr key={row.year}>
                    <td style={tableStyle.cell}>{row.year}</td>
                    <td style={tableStyle.cell}>{row.baseOM}</td>
                    <td style={tableStyle.cell}>{row.oem}</td>
                    <td style={tableStyle.cell}>{row.failures}</td>
                    <td style={tableStyle.cell}>{row.majorRepairs}</td>
                    <td style={tableStyle.cell}>{row.contingency}</td>
                    <td style={tableStyle.cell}>{row.totalCost}</td>
                    <td style={tableStyle.cell}>{row.revenue}</td>
                    <td style={tableStyle.cell}>{row.netCashFlow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Cashflow Analysis</Title>
      <p>Analyze projected costs, revenue, and net cash flow over the project lifetime.</p>
      
      <Tabs defaultActiveKey="costs" items={tabItems} />
    </div>
  );
};

// Styling for the table
const tableStyle = {
  header: {
    backgroundColor: '#f0f2f5',
    padding: '12px 8px',
    textAlign: 'left',
    borderBottom: '1px solid #e8e8e8'
  },
  cell: {
    padding: '12px 8px',
    borderBottom: '1px solid #e8e8e8'
  }
};

export default CashflowAnalysis;