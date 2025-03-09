import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const ChartDisplay = ({ irrDistribution, averageCashflow, averageDscr }) => {
  // Check if required data is available
  if (!irrDistribution || !averageCashflow || !averageDscr) {
    return <Typography>Unable to display charts: Data is missing.</Typography>;
  }

  // Generate year labels for time-based graphs
  const years = Array.from({ length: averageCashflow.length }, (_, i) => i + 1);

  // Sort the IRR distribution to calculate percentiles
  const sortedIrr = [...irrDistribution].sort((a, b) => a - b);

  // Function to calculate a percentile value from sorted data
  const getPercentile = (sortedData, percentile) => {
    const index = Math.ceil((percentile / 100) * sortedData.length) - 1;
    return sortedData[index];
  };

  // Calculate P50, P75, and P90 values
  const p50 = getPercentile(sortedIrr, 50); // 50th percentile (median)
  const p75 = getPercentile(sortedIrr, 75); // 75th percentile
  const p90 = getPercentile(sortedIrr, 90); // 90th percentile

  // Define the percentiles with labels and colors for the markers
  const percentiles = [
    { label: 'P50', value: p50, color: 'green' },
    { label: 'P75', value: p75, color: 'orange' },
    { label: 'P90', value: p90, color: 'red' },
  ];

  // Create shapes for vertical line markers
  const shapes = percentiles
    .filter(p => p.value !== undefined) // Ensure value is defined
    .map(p => ({
      type: 'line',
      x0: p.value * 100, // Convert to percentage
      x1: p.value * 100,
      y0: 0,
      y1: 1,
      yref: 'paper', // Span the full height of the chart
      line: {
        color: p.color,
        width: 2,
        dash: 'dash',
      },
    }));

  // Create annotations to label the markers
  const annotations = percentiles
    .filter(p => p.value !== undefined)
    .map(p => ({
      x: p.value * 100,
      y: 1,
      yref: 'paper',
      text: p.label,
      showarrow: true,
      arrowhead: 2,
      ax: 0,
      ay: -40, // Position label above the line
    }));

  return (
    <Box>
      {/* IRR Distribution Histogram with P50, P75, P90 markers */}
      <Plot
        data={[
          {
            x: irrDistribution.map(irr => irr * 100), // Convert IRR to percentage
            type: 'histogram',
            marker: { color: '#3f51b5' },
          },
        ]}
        layout={{
          title: 'IRR Distribution',
          xaxis: { title: 'IRR (%)' },
          yaxis: { title: 'Frequency' },
          shapes: shapes, // Add vertical line markers
          annotations: annotations, // Add labels for the markers
        }}
      />

      {/* Average Cashflow Over Time - Unchanged */}
      <Plot
        data={[
          {
            x: years,
            y: averageCashflow,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#4caf50' },
          },
        ]}
        layout={{
          title: 'Average Cashflow Over Time',
          xaxis: { title: 'Year' },
          yaxis: { title: 'Cashflow ($)' },
        }}
      />

      {/* Average DSCR Over Time - Unchanged */}
      <Plot
        data={[
          {
            x: years,
            y: averageDscr,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#f50057' },
          },
        ]}
        layout={{
          title: 'Average DSCR Over Time',
          xaxis: { title: 'Year' },
          yaxis: { title: 'DSCR' },
        }}
      />
    </Box>
  );
};

export default ChartDisplay;