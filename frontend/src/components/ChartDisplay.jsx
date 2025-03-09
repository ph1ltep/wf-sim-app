import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const ChartDisplay = ({ results }) => {
  const { irrDistribution, dscrDistribution } = results;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        IRR Distribution
      </Typography>
      <Plot
        data={[
          {
            x: irrDistribution.map(val => val * 100),  // convert to percentage
            type: 'histogram',
            marker: { color: '#3f51b5' },
          },
        ]}
        layout={{ width: 600, height: 400, title: 'IRR Histogram (%)' }}
      />
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        DSCR Distribution
      </Typography>
      <Plot
        data={[
          {
            x: dscrDistribution,
            type: 'histogram',
            marker: { color: '#f50057' },
          },
        ]}
        layout={{ width: 600, height: 400, title: 'DSCR Histogram' }}
      />
    </Box>
  );
};

export default ChartDisplay;
