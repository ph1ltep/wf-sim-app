// frontend/src/components/ChartDisplay.jsx
import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography, Tabs, Tab } from '@mui/material';

const ChartDisplay = ({ results, projectLife, loanDuration, compareScenarios = [] }) => {
  const [tabValue, setTabValue] = React.useState(0);

  // IRR Histogram
  const irrData = [{
    x: results.irrDistribution.map(v => v * 100),
    type: 'histogram',
    marker: { color: '#3f51b5' },
    nbinsx: 20,
    name: 'Current Scenario'
  }];
  if (compareScenarios.length) {
    compareScenarios.forEach((sc, idx) => {
      irrData.push({
        x: sc.results.irrDistribution.map(v => v * 100),
        type: 'histogram',
        marker: { color: ['#ff9800', '#4caf50', '#f44336'][idx % 3] },
        nbinsx: 20,
        name: sc.name,
        opacity: 0.6
      });
    });
  }

  // Cumulative Cash Flow
  const cumulative = [0];
  results.averageCashFlow.reduce((acc, val) => {
    cumulative.push(acc + val);
    return acc + val;
  }, 0);
  const cashFlowData = [{
    x: Array.from({ length: projectLife + 1 }, (_, i) => i),
    y: cumulative,
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: '#43a047' },
    line: { shape: 'spline' },
    name: 'Current Scenario'
  }];

  // DSCR Over Time
  const dscrData = [{
    x: Array.from({ length: loanDuration }, (_, i) => i + 1),
    y: results.averageDSCR.slice(1, loanDuration + 1),
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: '#0288d1' },
    name: 'Average DSCR'
  }, {
    y: Array(loanDuration).fill(1),
    type: 'scatter',
    mode: 'lines',
    line: { color: 'red', dash: 'dash' },
    name: 'DSCR = 1'
  }];

  // Cost Breakdown
  const costData = [{
    labels: ['Routine O&M', 'Major Repairs', 'Insurance Premiums', 'Other Costs'],
    values: [
      results.avgCostBreakdown.routineOM,
      results.avgCostBreakdown.majorRepairs,
      results.avgCostBreakdown.insurancePremiums,
      results.avgCostBreakdown.other
    ],
    type: 'pie',
    marker: { colors: ['#3f51b5', '#ff9800', '#4caf50', '#f44336'] }
  }];

  return (
    <Box>
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} centered>
        <Tab label="IRR Distribution" />
        <Tab label="Cumulative Cash Flow" />
        <Tab label="DSCR Over Time" />
        <Tab label="Cost Breakdown" />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>IRR Distribution</Typography>
          <Plot data={irrData} layout={{ width: 600, height: 400, title: 'IRR Histogram (%)', xaxis: { title: 'IRR (%)' }, yaxis: { title: 'Frequency' } }} />
        </>
      )}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>Cumulative Cash Flow</Typography>
          <Plot data={cashFlowData} layout={{ width: 600, height: 400, title: 'Cumulative Cash Flow ($)', xaxis: { title: 'Year' }, yaxis: { title: 'Cumulative Cash Flow ($)' } }} />
        </>
      )}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>DSCR Over Time</Typography>
          <Plot data={dscrData} layout={{ width: 600, height: 400, title: 'Average DSCR per Year', xaxis: { title: 'Year' }, yaxis: { title: 'DSCR' } }} />
        </>
      )}
      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>Cost Breakdown</Typography>
          <Plot data={costData} layout={{ width: 600, height: 400, title: 'Average Cost Breakdown ($)' }} />
        </>
      )}
    </Box>
  );
};

export default ChartDisplay;