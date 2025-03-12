// frontend/src/pages/SimulationPage.jsx
import React, { useContext, useState } from 'react';
import { Grid, Typography, Box, Button } from '@mui/material';
import ConfigPanel from '../components/ConfigPanel';
import SimulationResults from '../components/SimulationResults';
import InputDistributions from '../components/InputDistributions';
import { SimulationContext } from '../context/SimulationContext';

const SimulationPage = ({ location }) => {
  const { simulationData, setSimulationData } = useContext(SimulationContext);
  const [compareScenarios, setCompareScenarios] = useState(location?.state?.compareScenarios || []);

  const handleSimulationRun = (params, simResults) => {
    setSimulationData({ params, results: simResults });
  };

  // Use location.state.scenario.parameters if available, otherwise fall back to simulationData.params or defaultParams
  const initialParams = location?.state?.scenario?.parameters || 
                       (simulationData?.params ? simulationData.params : null);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Simulation Configuration</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <ConfigPanel 
            onRunSimulation={handleSimulationRun} 
            initialParams={initialParams || undefined} // Pass undefined if no initial params
          />
        </Grid>
        <Grid item xs={12} md={7}>
          {simulationData?.params && <InputDistributions params={simulationData.params} />}
          {simulationData?.results && (
            <SimulationResults
              params={simulationData.params}
              results={simulationData.results}
              onSave={() => {}}
            />
          )}
          {!simulationData?.results && (
            <Typography variant="subtitle1">Run a simulation to view results.</Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulationPage;