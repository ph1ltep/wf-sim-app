// frontend/src/components/SimulationResults.jsx
import React from 'react';
import { Box, Paper, Typography, Grid, Divider, Button, Stack } from '@mui/material';
import ChartDisplay from './ChartDisplay';
import { exportToCSV, exportToPDF } from '../services/export';
import { saveScenario } from '../services/api';

const SimulationResults = ({ params, results, onSave }) => {
  console.log('SimulationResults - params:', params);
  console.log('SimulationResults - results:', results);

  const handleSave = async () => {
    const name = prompt('Enter scenario name:');
    if (name) {
      await saveScenario({ name, parameters: params, results });
      onSave();
    }
  };

  // Extract values with null-safe defaults
  const averageIRR = results?.averageIRR ?? 0;
  const irrPercentiles = results?.irrPercentiles ?? { p10: 0, p50: 0, p90: 0 };
  const averagePayback = results?.averagePayback ?? 0;
  const minDSCRDist = results?.minDSCRDist ?? { p5: 0, probBelow1: 0 };

  return (
    <Paper sx={{ p: 3 }}>
      <Box id="results-export">
        <Typography variant="h6" gutterBottom>Simulation Results</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>Average IRR: {(averageIRR * 100).toFixed(2)}%</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              IRR Percentiles: 
              P10: {(irrPercentiles.p10 * 100).toFixed(2)}%, 
              P50: {(irrPercentiles.p50 * 100).toFixed(2)}%, 
              P90: {(irrPercentiles.p90 * 100).toFixed(2)}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Average Payback Year: {(averagePayback || 0).toFixed(1)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              Min DSCR P5: {(minDSCRDist.p5 || 0).toFixed(2)}, 
              Prob &lt; 1: {(minDSCRDist.probBelow1 * 100 || 0).toFixed(2)}%
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        {results && params ? (
          <ChartDisplay 
            results={results} 
            projectLife={params.projectLife} 
            loanDuration={params.loanDuration} 
          />
        ) : (
          <Typography>No chart data available</Typography>
        )}
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