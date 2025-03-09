import React, { useState } from 'react';
import { Box, Button, TextField, Grid } from '@mui/material';
import { runSimulation } from '../services/api';

const ConfigPanel = ({ setSimulationResults }) => {
  const [formValues, setFormValues] = useState({
    years: 30,
    annualRevenue: 1000000,
    baseOM: 500000,
    annualDebtService: 200000,
    escalationMean: 0.02,
    escalationStd: 0.005,
    riskProbability: 0.1,
    riskCost: 100000,
    riskYear: 15,
  });
  
  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: Number(e.target.value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const results = await runSimulation(formValues);
      setSimulationResults(results);
    } catch (error) {
      console.error("Error running simulation", error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Project Years"
            name="years"
            type="number"
            value={formValues.years}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Annual Revenue"
            name="annualRevenue"
            type="number"
            value={formValues.annualRevenue}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Base O&M Cost"
            name="baseOM"
            type="number"
            value={formValues.baseOM}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Annual Debt Service"
            name="annualDebtService"
            type="number"
            value={formValues.annualDebtService}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Escalation Mean"
            name="escalationMean"
            type="number"
            value={formValues.escalationMean}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Escalation Std Dev"
            name="escalationStd"
            type="number"
            value={formValues.escalationStd}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Risk Probability"
            name="riskProbability"
            type="number"
            value={formValues.riskProbability}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Risk Cost"
            name="riskCost"
            type="number"
            value={formValues.riskCost}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Risk Year"
            name="riskYear"
            type="number"
            value={formValues.riskYear}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          Run Simulation
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigPanel;
