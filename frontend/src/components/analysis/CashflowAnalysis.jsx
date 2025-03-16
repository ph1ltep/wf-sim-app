// src/components/analysis/CashflowAnalysis.jsx
import React from 'react';
import { Typography, Card, Tabs } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import Plot from 'react-plotly.js';

const { Title } = Typography;

const CashflowAnalysis = () => {
  const { scenarioData, loading } = useScenario();
  
  // Check if simulation results are loaded
  const simulationData = scenarioData?.simulation?.inputSim?.cashflow;
  const projectLife = scenarioData?.settings?.general?.projectLife || 20;
  const years = Array.from({ length: projectLife }, (_, i) => i + 1);
  
  // If no simulation data is available yet, create empty placeholders
  let baseOMCosts = [];
  let failureRiskCosts = [];
  let majorRepairCosts = [];
  let oemCosts = [];
  let contingencyCosts = [];
  let totalCosts = [];
  let revenues = [];
  let netCashFlow = [];
  
  // Extract data from simulation results if available
  if (simulationData) {
    // Extract cost components
    baseOMCosts = simulationData.annualCosts?.components?.baseOM?.Pprimary || Array(projectLife).fill(0);
    failureRiskCosts = simulationData.annualCosts?.components?.failureRisk?.Pprimary || Array(projectLife).fill(0);
    majorRepairCosts = simulationData.annualCosts?.components?.majorRepairs?.Pprimary || Array(projectLife).fill(0);
    contingencyCosts = simulationData.annualCosts?.components?.contingency?.Pprimary || Array(projectLife).fill(0);
    
    // Get total costs
    totalCosts = simulationData.annualCosts?.total?.Pprimary || Array(projectLife).fill(0);
    
    // Calculate OEM costs as the remainder
    oemCosts = years.map((_, i) => {
      const knownCosts = (baseOMCosts[i] || 0) + (failureRiskCosts[i] || 0) + 
                       (majorRepairCosts[i] || 0) + (contingencyCosts[i] || 0);
      return Math.max(0, (totalCosts[i] || 0) - knownCosts);
    });
    
    // Get revenue and calculate net cash flow
    revenues = simulationData.annualRevenue?.Pprimary || Array(projectLife).fill(0);
    netCashFlow = simulationData.netCashFlow?.Pprimary || 
                  years.map((_, i) => (revenues[i] || 0) - (totalCosts[i] || 0));
  }
  
  // Format data for table display
  const tableData = years.map((year, i) => ({
    year,
    baseOM: formatCurrency(baseOMCosts[i] || 0),
    oem: formatCurrency(oemCosts[i] || 0),
    failures: formatCurrency(failureRiskCosts[i] || 0),
    majorRepairs: formatCurrency(majorRepairCosts[i] || 0),
    contingency: formatCurrency(contingencyCosts[i] || 0),
    totalCost: formatCurrency(totalCosts[i] || 0),
    revenue: formatCurrency(revenues[i] || 0),
    netCashFlow: formatCurrency(netCashFlow[i] || 0)
  }));

  // Helper function to format currency
  function formatCurrency(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

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
                y: failureRiskCosts,
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

  return (
    <div>
      <Title level={2}>Cashflow Analysis</Title>
      <p>Analyze projected costs, revenue, and net cash flow over the project lifetime.</p>
      
      {loading ? (
        <div>Loading cashflow data...</div>
      ) : !simulationData ? (
        <div>
          <p>No simulation data available. Run a simulation first to see the cashflow analysis.</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="costs" items={tabItems} />
      )}
    </div>
  );
};

export default CashflowAnalysis;