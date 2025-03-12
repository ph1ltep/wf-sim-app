// frontend/src/components/ChartDisplay.jsx
import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography, Tabs, Tab } from '@mui/material';

const ChartDisplay = ({ results, projectLife, loanDuration, compareScenarios = [] }) => {
  const [tabValue, setTabValue] = React.useState(0);

  const years = Array.from({ length: projectLife }, (_, i) => i + 1);

  // Cost Stacked Area Chart
  const costData = [
    {
      x: years,
      y: results.intermediateData.annualCosts.total.P50,
      type: 'scatter',
      mode: 'lines',
      name: 'P50',
      line: { color: '#3f51b5' },
      fill: 'tozeroy',
    },
    {
      x: years,
      y: results.intermediateData.annualCosts.total.P75,
      type: 'scatter',
      mode: 'lines',
      name: 'P75',
      line: { color: '#ff9800' },
      fill: 'tonexty',
      opacity: 0.5,
    },
    {
      x: years,
      y: results.intermediateData.annualCosts.total.P90,
      type: 'scatter',
      mode: 'lines',
      name: 'P90',
      line: { color: '#f44336' },
      fill: 'tonexty',
      opacity: 0.3,
    },
  ];

  // IRR Histogram
  const irrData = [{
    x: Array(1000).fill().map(() => Math.random() * (results.finalResults.IRR.P90 - results.finalResults.IRR.P50) + results.finalResults.IRR.P50),
    type: 'histogram',
    marker: { color: '#3f51b5' },
    name: 'Current Scenario',
  }];
  compareScenarios.forEach((sc, idx) => {
    irrData.push({
      x: Array(1000).fill().map(() => Math.random() * (sc.results.finalResults.IRR.P90 - sc.results.finalResults.IRR.P50) + sc.results.finalResults.IRR.P50),
      type: 'histogram',
      marker: { color: ['#ff9800', '#4caf50', '#f44336'][idx % 3] },
      name: sc.name,
      opacity: 0.6,
    });
  });

  return (
    <Box>
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} centered>
        <Tab label="Cost Over Time" />
        <Tab label="IRR Distribution" />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>Cost Distribution Over Time</Typography>
          <Plot
            data={costData}
            layout={{
              width: 600,
              height: 400,
              title: 'Annual Costs ($)',
              xaxis: { title: 'Year' },
              yaxis: { title: 'Cost ($)' },
            }}
          />
        </>
      )}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>IRR Distribution</Typography>
          <Plot
            data={irrData}
            layout={{
              width: 600,
              height: 400,
              title: 'IRR Histogram (%)',
              xaxis: { title: 'IRR (%)' },
              yaxis: { title: 'Frequency' },
            }}
          />
        </>
      )}
    </Box>
  );
};

export default ChartDisplay;