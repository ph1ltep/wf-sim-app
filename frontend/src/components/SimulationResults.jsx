// frontend/src/components/SimulationResults.jsx
import React from 'react';
import { Box, Paper, Typography, Grid, Divider, Button, Stack } from '@mui/material';
import ChartDisplay from './ChartDisplay';
import { exportToCSV, exportToPDF } from '../services/export';
import { saveScenario } from '../services/api';

const SimulationResults = ({ params, results, onSave }) => {
  // Log props for debugging
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
  const averageIRR = results?.averageIRR ?? 0; // Default to 0 if null/undefined
  const irrPercentiles = results?.irrPercentiles ?? { p10: 0, p50: 0, p90: 0 }; // Default object
  const averagePayback = results?.averagePayback ?? 0;
  const minDSCRDist = results?.minDSCRDist ?? { p5: 0, probBelow1: 0 };

  // Ensure all values are numbers before calling toFixed
  const safeAverageIRR = typeof averageIRR === 'number' ? averageIRR : 0;
  const safeP10 = typeof irrPercentiles.p10 === 'number' ? irrPercentiles.p10 : 0;
  const safeP50 = typeof irrPercentiles.p50 === 'number' ? irrPercentiles.p50 : 0;
  const safeP90 = typeof irrPercentiles.p90 === 'number' ? irrPercentiles.p90 : 0;
  const safeAveragePayback = typeof averagePayback === 'number' ? averagePayback : 0;
  const safeMinDSCR_P5 = typeof minDSCRDist.p5 === 'number' ? minDSCRDist.p5 : 0;
  const safeProbBelow1 = typeof minDSCRDist.probBelow1 === 'number' ? minDSCRDist.probBelow1 : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box id="results-export">
        <Typography variant="h6" gutterBottom>Simulation Results</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>Average IRR: {(safeAverageIRR * 100).toFixed(2)}%</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              IRR Percentiles:
              P10: {(safeP10 * 100).toFixed(2)}%,
              P50: {(safeP50 * 100).toFixed(2)}%,
              P90: {(safeP90 * 100).toFixed(2)}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Average Payback Year: {safeAveragePayback.toFixed(1)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              Min DSCR P5: {safeMinDSCR_P5.toFixed(2)},
              Prob &lt; 1: {(safeProbBelow1 * 100).toFixed(2)}%
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