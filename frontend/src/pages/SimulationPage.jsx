import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ConfigPanel from '../components/ConfigPanel';
import SimulationResults from '../components/SimulationResults';

const SimulationPage = () => {
  const [simulationResults, setSimulationResults] = useState(null);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Run Simulation
      </Typography>
      <Box sx={{ my: 2 }}>
        <ConfigPanel setSimulationResults={setSimulationResults} />
      </Box>
      {simulationResults && (
        <Box sx={{ my: 2 }}>
          <SimulationResults results={simulationResults} />
        </Box>
      )}
    </Container>
  );
};

export default SimulationPage;
