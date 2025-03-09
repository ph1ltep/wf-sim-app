// frontend/src/components/ChartDisplay.jsx
import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const ChartDisplay = ({ results, projectLife, loanDuration }) => {
  // IRR Histogram
  const irrData = {
    x: results.irrDistribution.map(v => v * 100), // convert to percentage
    type: 'histogram',
    marker: { color: '#3f51b5' },
    nbinsx: 20,
  };

  // Calculate cumulative cash flow from average cash flows
  const cumulative = [];
  results.averageCashFlow.reduce((acc, val, idx) => {
    cumulative[idx] = acc + val;
    return cumulative[idx];
  }, 0);

  const cashFlowData = {
    x: Array.from({ length: projectLife + 1 }, (_, i) => i),
    y: cumulative,
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: '#43a047' },
    line: { shape: 'spline' },
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        IRR Distribution
      </Typography>
      <Plot
        data={[irrData]}
        layout={{
          width: 600,
          height: 400,
          title: 'IRR Histogram (%)',
          xaxis: { title: 'IRR (%)' },
          yaxis: { title: 'Frequency' },
          margin: { t: 50, l: 50, r: 50, b: 50 }
        }}
      />
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Cumulative Cash Flow
      </Typography>
      <Plot
        data={[cashFlowData]}
        layout={{
          width: 600,
          height: 400,
          title: 'Cumulative Cash Flow ($)',
          xaxis: { title: 'Year' },
          yaxis: { title: 'Cumulative Cash Flow ($)' },
          margin: { t: 50, l: 50, r: 50, b: 50 }
        }}
      />
    </Box>
  );
};

export default ChartDisplay;
