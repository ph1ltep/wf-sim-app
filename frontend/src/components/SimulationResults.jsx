// frontend/src/components/SimulationResults.jsx
import React from 'react';
import { Box, Paper, Typography, Grid, Divider, Button, Stack } from '@mui/material';
import ChartDisplay from './ChartDisplay';
import { exportToCSV, exportToPDF } from '../services/export';
import { saveScenario } from '../services/api';

const SimulationResults = ({ params, results, onSave }) => {
  const handleSave = async () => {
    const name = prompt('Enter scenario name:');
    if (name) {
      await saveScenario({ name, parameters: params, results });
      onSave();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box id="results-export">
        <Typography variant="h6" gutterBottom>Simulation Results</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}><Typography>Average IRR: {(results.averageIRR * 100).toFixed(2)}%</Typography></Grid>
          <Grid item xs={6}><Typography>IRR Percentiles: P10: {(results.irrPercentiles.p10 * 100).toFixed(2)}%, P50: {(results.irrPercentiles.p50 * 100).toFixed(2)}%, P90: {(results.irrPercentiles.p90 * 100).toFixed(2)}%</Typography></Grid>
          <Grid item xs={6}><Typography>Average Payback Year: {results.averagePayback.toFixed(1)}</Typography></Grid>
          <Grid item xs={6}><Typography>Min DSCR P5: {results.minDSCRDist.p5.toFixed(2)}, Prob &lt; 1: {(results.minDSCRDist.probBelow1 * 100).toFixed(2)}%</Typography></Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <ChartDisplay results={results} projectLife={params.projectLife} loanDuration={params.loanDuration} />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="center">
        <Button variant="outlined" onClick={() => exportToCSV(results)}>Export CSV</Button>
        <Button variant="outlined" onClick={() => exportToPDF('results-export')}>Export PDF</Button>
        <Button variant="contained" onClick={handleSave}>Save Scenario</Button>
      </Stack>
    </Paper>
  );
};

export default SimulationResults;