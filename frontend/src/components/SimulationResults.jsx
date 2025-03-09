// frontend/src/components/SimulationResults.jsx
import React from 'react';
import { Box, Paper, Typography, Grid, Divider, Button, Stack } from '@mui/material';
import ChartDisplay from './ChartDisplay';
import { exportToCSV, exportToPDF } from '../services/export';

const SimulationResults = ({ params, results }) => {
  const handleExportCSV = () => {
    exportToCSV(results);
  };

  const handleExportPDF = () => {
    exportToPDF("results-export");
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box id="results-export">
        <Typography variant="h6" gutterBottom>
          Simulation Results
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>
              Average IRR: {(results.averageIRR * 100).toFixed(2)}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              IRR Percentiles: P10: {(results.irrPercentiles.p10 * 100).toFixed(2)}%, P50: {(results.irrPercentiles.p50 * 100).toFixed(2)}%, P90: {(results.irrPercentiles.p90 * 100).toFixed(2)}%
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography>
              Average Annual Cash Flows: {results.averageCashFlow.map((cf, idx) => `Year ${idx}: $${cf.toFixed(0)}`).join(', ')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography>
              Average DSCR (Years 1-{params.loanDuration}): {results.averageDSCR.slice(1, params.loanDuration + 1).map((d, idx) => `Year ${idx+1}: ${d.toFixed(2)}`).join(', ')}
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <ChartDisplay results={results} loanDuration={params.loanDuration} projectLife={params.projectLife} />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="center">
        <Button variant="outlined" onClick={handleExportCSV}>Export CSV</Button>
        <Button variant="outlined" onClick={handleExportPDF}>Export PDF</Button>
      </Stack>
    </Paper>
  );
};

export default SimulationResults;
