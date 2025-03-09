import React from 'react';
import { Box, Typography } from '@mui/material';
import ChartDisplay from './ChartDisplay';

const SimulationResults = ({ results }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Simulation Results
      </Typography>
      <Typography>
        Average IRR: {(results.averageIRR * 100).toFixed(2)}%
      </Typography>
      <Typography>
        Average DSCR: {results.averageDSCR.toFixed(2)}
      </Typography>
      <ChartDisplay results={results} />
    </Box>
  );
};

export default SimulationResults;
