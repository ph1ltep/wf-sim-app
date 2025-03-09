// frontend/src/components/ConfigPanel.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Grid, Typography, Paper, Divider, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { runSimulation } from '../services/api';

const defaultParams = {
  projectLife: 25,
  loanDuration: 15,
  initialInvestment: 10000000, // $
  baseOM: 500000,              // annual O&M cost ($)
  escalationMean: 0.02,
  escalationStd: 0.005,
  oemTerm: 10,
  fixedOM: 550000,
  riskEvents: [
    {
      description: 'Gearbox Failure',
      minYear: 11,
      maxYear: 20,
      weibullShape: 2.0,
      weibullScale: 15,
      costImpact: 300000
    }
  ],
  windResource: {
    baseProduction: 300000,    // MWh/year
    weibullShape: 2.5,
    weibullScale: 1.0
  },
  powerPrice: {
    min: 40,
    mode: 50,
    max: 70
  },
  debtService: 700000,
  iterations: 10000,
  distributions: {
    costEscalation: "Normal",
    windResource: "Weibull",
    powerPrice: "Triangle"
  }
};

const ConfigPanel = ({ onRunSimulation, initialParams }) => {
  const [params, setParams] = useState(initialParams || defaultParams);
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleNestedChange = (e, section) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: Number(value)
      }
    }));
  };

  const handleRiskEventChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      riskEvents: [
        {
          ...prev.riskEvents[0],
          [name]: name === 'description' ? value : Number(value)
        }
      ]
    }));
  };

  const toggleAdvanced = () => {
    setAdvancedOpen(!advancedOpen);
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await runSimulation(params);
      if (response.success) {
        onRunSimulation(params, response.results);
      } else {
        alert("Simulation failed: " + response.error);
      }
    } catch (error) {
      console.error("Error running simulation:", error);
      alert("Simulation error. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Project & Financial Inputs
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Project Life (years)"
            name="projectLife"
            type="number"
            value={params.projectLife}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Loan Duration (years)"
            name="loanDuration"
            type="number"
            value={params.loanDuration}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Initial Investment ($)"
            name="initialInvestment"
            type="number"
            value={params.initialInvestment}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Base O&M Cost ($/year)"
            name="baseOM"
            type="number"
            value={params.baseOM}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Escalation Mean (%)"
            name="escalationMean"
            type="number"
            value={params.escalationMean}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Escalation Std Dev (%)"
            name="escalationStd"
            type="number"
            value={params.escalationStd}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="OEM Term (years)"
            name="oemTerm"
            type="number"
            value={params.oemTerm}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Fixed O&M Cost ($/year)"
            name="fixedOM"
            type="number"
            value={params.fixedOM}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Risk Event (e.g., Major Failure)
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Description"
            name="description"
            value={params.riskEvents[0].description}
            onChange={handleRiskEventChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Min Year"
            name="minYear"
            type="number"
            value={params.riskEvents[0].minYear}
            onChange={handleRiskEventChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Max Year"
            name="maxYear"
            type="number"
            value={params.riskEvents[0].maxYear}
            onChange={handleRiskEventChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Cost Impact ($)"
            name="costImpact"
            type="number"
            value={params.riskEvents[0].costImpact}
            onChange={handleRiskEventChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Weibull Shape"
            name="weibullShape"
            type="number"
            value={params.riskEvents[0].weibullShape}
            onChange={handleRiskEventChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Weibull Scale"
            name="weibullScale"
            type="number"
            value={params.riskEvents[0].weibullScale}
            onChange={handleRiskEventChange}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Wind Resource & Power Price Inputs
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Base Production (MWh/year)"
            name="baseProduction"
            type="number"
            value={params.windResource.baseProduction}
            onChange={(e) => handleNestedChange(e, 'windResource')}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Wind Weibull Shape"
            name="weibullShape"
            type="number"
            value={params.windResource.weibullShape}
            onChange={(e) => handleNestedChange(e, 'windResource')}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Wind Weibull Scale"
            name="weibullScale"
            type="number"
            value={params.windResource.weibullScale}
            onChange={(e) => handleNestedChange(e, 'windResource')}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Power Price Min ($/MWh)"
            name="min"
            type="number"
            value={params.powerPrice.min}
            onChange={(e) => handleNestedChange(e, 'powerPrice')}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Power Price Mode ($/MWh)"
            name="mode"
            type="number"
            value={params.powerPrice.mode}
            onChange={(e) => handleNestedChange(e, 'powerPrice')}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Power Price Max ($/MWh)"
            name="max"
            type="number"
            value={params.powerPrice.max}
            onChange={(e) => handleNestedChange(e, 'powerPrice')}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Financing Inputs
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Annual Debt Service ($)"
            name="debtService"
            type="number"
            value={params.debtService}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Iterations"
            name="iterations"
            type="number"
            value={params.iterations}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <IconButton onClick={toggleAdvanced}>
          {advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <Typography variant="body2">Advanced Settings</Typography>
      </Box>
      <Collapse in={advancedOpen}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1">Distribution Templates</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              label="Cost Escalation Distribution"
              name="costEscalationDist"
              type="text"
              value={params.distributions.costEscalation}
              onChange={(e) => setParams(prev => ({ ...prev, distributions: { ...prev.distributions, costEscalation: e.target.value } }))}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Wind Resource Distribution"
              name="windResourceDist"
              type="text"
              value={params.distributions.windResource}
              onChange={(e) => setParams(prev => ({ ...prev, distributions: { ...prev.distributions, windResource: e.target.value } }))}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Power Price Distribution"
              name="powerPriceDist"
              type="text"
              value={params.distributions.powerPrice}
              onChange={(e) => setParams(prev => ({ ...prev, distributions: { ...prev.distributions, powerPrice: e.target.value } }))}
              fullWidth
            />
          </Grid>
        </Grid>
      </Collapse>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleRun} disabled={loading}>
          {loading ? 'Running Simulation...' : 'Run Simulation'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ConfigPanel;
