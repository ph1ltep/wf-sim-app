// frontend/src/components/InputDistributions.jsx
import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const InputDistributions = ({ params }) => {
  const generateSamples = (dist, count = 1000) => {
    if (dist.distribution === 'Normal') {
      return Array(count).fill().map(() => {
        const z = Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
        return dist.mean + dist.std * z;
      });
    }
    return Array(count).fill(dist.mean);
  };

  const energyData = [{
    x: generateSamples(params.revenue.energyProduction),
    type: 'histogram',
    marker: { color: '#3f51b5' },
  }];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Input Distributions</Typography>
      <Plot
        data={energyData}
        layout={{
          width: 600,
          height: 400,
          title: 'Energy Production Distribution (MWh/year)',
          xaxis: { title: 'Energy Production (MWh/year)' },
          yaxis: { title: 'Frequency' },
        }}
      />
    </Box>
  );
};

export default InputDistributions;