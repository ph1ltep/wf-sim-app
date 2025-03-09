// frontend/src/pages/SimulationPage.jsx
import React, { useContext } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import ConfigPanel from '../components/ConfigPanel';
import SimulationResults from '../components/SimulationResults';
import { SimulationContext } from '../context/SimulationContext';

const SimulationPage = () => {
  const { simulationData, setSimulationData } = useContext(SimulationContext);

  const handleSimulationRun = (params, simResults) => {
    setSimulationData({ params, results: simResults });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Simulation Configuration
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <ConfigPanel onRunSimulation={handleSimulationRun} initialParams={simulationData.params} />
        </Grid>
        <Grid item xs={12} md={7}>
          {simulationData.results ? (
            <SimulationResults params={simulationData.params} results={simulationData.results} />
          ) : (
            <Typography variant="subtitle1">Run a simulation to view results.</Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulationPage;
