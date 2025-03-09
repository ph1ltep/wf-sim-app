// frontend/src/components/ConfigPanel.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Grid, Typography, Paper, Tabs, Tab, IconButton, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { runSimulation } from '../services/api';

const defaultParams = {
  projectLife: 25,
  loanDuration: 15,
  initialInvestment: 10000000,
  baseOM: 500000,
  escalationMean: 0.02,
  escalationStd: 0.005,
  oemTerm: 10,
  fixedOM: 550000,
  riskEvents: [{ description: 'Gearbox Failure', probability: 0.05, costImpact: 300000, minYear: 11, maxYear: 20 }],
  scheduledMaintenance: [{ description: 'Mid-life Overhaul', year: 10, cost: 500000 }],
  insurance: { enabled: false, premium: 100000, coveragePercent: 0.8, deductible: 50000 },
  otherCosts: [{ description: 'Land Lease', annualCost: 200000 }],
  financing: {
    debtService: Array(15).fill(700000),
    minDSCR: 1.3,
    reserveMonths: 6,
    equityInvestment: 2000000,
    targetIRR: 0.1
  },
  revenue: {
    energyProduction: { mean: 300000, std: 30000, distribution: 'normal' },
    powerPrice: { type: 'fixed', value: 50 },
    degradationRate: 0.005,
    otherRevenue: [{ description: 'REC', annualAmount: 100000 }]
  },
  simulation: {
    iterations: 10000,
    seed: 42,
    distributions: {
      costEscalation: 'normal',
      energyProduction: 'normal',
      powerPrice: 'triangle'
    }
  }
};

const ConfigPanel = ({ onRunSimulation, initialParams }) => {
  const [params, setParams] = useState(initialParams || defaultParams);
  const [tabValue, setTabValue] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const handleChange = (e, section = null, index = null) => {
    const { name, value } = e.target;
    if (section && index !== null) {
      setParams(prev => ({
        ...prev,
        [section]: prev[section].map((item, i) => i === index ? { ...item, [name]: isNaN(value) ? value : Number(value) } : item)
      }));
    } else if (section) {
      setParams(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: isNaN(value) ? value : Number(value) }
      }));
    } else {
      setParams(prev => ({ ...prev, [name]: Number(value) }));
    }
  };

  const addItem = (section) => {
    setParams(prev => ({
      ...prev,
      [section]: [...prev[section], section === 'riskEvents' ? { description: '', probability: 0.05, costImpact: 0, minYear: 1, maxYear: prev.projectLife } : { description: '', year: 1, cost: 0 }]
    }));
  };

  const removeItem = (section, index) => {
    setParams(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await runSimulation(params);
      if (response.success) onRunSimulation(params, response.results);
    } catch (error) {
      alert('Simulation error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
        <Tab label="Project" />
        <Tab label="Costs" />
        <Tab label="Revenue" />
        <Tab label="Financing" />
        <Tab label="Simulation" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}><TextField label="Project Life (years)" name="projectLife" type="number" value={params.projectLife} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Loan Duration (years)" name="loanDuration" type="number" value={params.loanDuration} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Initial Investment ($)" name="initialInvestment" type="number" value={params.initialInvestment} onChange={handleChange} fullWidth /></Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField label="Base O&M Cost ($/year)" name="baseOM" type="number" value={params.baseOM} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={3}><TextField label="Escalation Mean" name="escalationMean" type="number" value={params.escalationMean} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={3}><TextField label="Escalation Std Dev" name="escalationStd" type="number" value={params.escalationStd} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={6}><TextField label="OEM Term (years)" name="oemTerm" type="number" value={params.oemTerm} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={6}><TextField label="Fixed O&M Cost ($/year)" name="fixedOM" type="number" value={params.fixedOM} onChange={handleChange} fullWidth /></Grid>
          </Grid>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Risk Events</Typography>
          {params.riskEvents.map((event, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mt: 1 }}>
              <Grid item xs={4}><TextField label="Description" name="description" value={event.description} onChange={(e) => handleChange(e, 'riskEvents', idx)} fullWidth /></Grid>
              <Grid item xs={2}><TextField label="Probability" name="probability" type="number" value={event.probability} onChange={(e) => handleChange(e, 'riskEvents', idx)} fullWidth /></Grid>
              <Grid item xs={2}><TextField label="Cost Impact ($)" name="costImpact" type="number" value={event.costImpact} onChange={(e) => handleChange(e, 'riskEvents', idx)} fullWidth /></Grid>
              <Grid item xs={1}><TextField label="Min Year" name="minYear" type="number" value={event.minYear} onChange={(e) => handleChange(e, 'riskEvents', idx)} fullWidth /></Grid>
              <Grid item xs={1}><TextField label="Max Year" name="maxYear" type="number" value={event.maxYear} onChange={(e) => handleChange(e, 'riskEvents', idx)} fullWidth /></Grid>
              <Grid item xs={1}><IconButton onClick={() => removeItem('riskEvents', idx)}><RemoveIcon /></IconButton></Grid>
            </Grid>
          ))}
          <Button onClick={() => addItem('riskEvents')} startIcon={<AddIcon />}>Add Risk Event</Button>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Scheduled Maintenance</Typography>
          {params.scheduledMaintenance.map((maint, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mt: 1 }}>
              <Grid item xs={4}><TextField label="Description" name="description" value={maint.description} onChange={(e) => handleChange(e, 'scheduledMaintenance', idx)} fullWidth /></Grid>
              <Grid item xs={3}><TextField label="Year" name="year" type="number" value={maint.year} onChange={(e) => handleChange(e, 'scheduledMaintenance', idx)} fullWidth /></Grid>
              <Grid item xs={3}><TextField label="Cost ($)" name="cost" type="number" value={maint.cost} onChange={(e) => handleChange(e, 'scheduledMaintenance', idx)} fullWidth /></Grid>
              <Grid item xs={1}><IconButton onClick={() => removeItem('scheduledMaintenance', idx)}><RemoveIcon /></IconButton></Grid>
            </Grid>
          ))}
          <Button onClick={() => addItem('scheduledMaintenance')} startIcon={<AddIcon />}>Add Maintenance</Button>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Insurance</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}><TextField label="Enabled" name="enabled" type="checkbox" checked={params.insurance.enabled} onChange={(e) => handleChange({ target: { name: 'enabled', value: e.target.checked } }, 'insurance')} /></Grid>
            <Grid item xs={3}><TextField label="Premium ($/year)" name="premium" type="number" value={params.insurance.premium} onChange={(e) => handleChange(e, 'insurance')} fullWidth /></Grid>
            <Grid item xs={3}><TextField label="Coverage (%)" name="coveragePercent" type="number" value={params.insurance.coveragePercent} onChange={(e) => handleChange(e, 'insurance')} fullWidth /></Grid>
            <Grid item xs={3}><TextField label="Deductible ($)" name="deductible" type="number" value={params.insurance.deductible} onChange={(e) => handleChange(e, 'insurance')} fullWidth /></Grid>
          </Grid>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Other Costs</Typography>
          {params.otherCosts.map((cost, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mt: 1 }}>
              <Grid item xs={6}><TextField label="Description" name="description" value={cost.description} onChange={(e) => handleChange(e, 'otherCosts', idx)} fullWidth /></Grid>
              <Grid item xs={4}><TextField label="Annual Cost ($)" name="annualCost" type="number" value={cost.annualCost} onChange={(e) => handleChange(e, 'otherCosts', idx)} fullWidth /></Grid>
              <Grid item xs={1}><IconButton onClick={() => removeItem('otherCosts', idx)}><RemoveIcon /></IconButton></Grid>
            </Grid>
          ))}
          <Button onClick={() => addItem('otherCosts')} startIcon={<AddIcon />}>Add Other Cost</Button>
        </Box>
      )}

      {tabValue === 2 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}><TextField label="Energy Mean (MWh/year)" name="mean" type="number" value={params.revenue.energyProduction.mean} onChange={(e) => handleChange(e, 'revenue.energyProduction')} fullWidth /></Grid>
          <Grid item xs={4}><TextField label="Energy Std Dev" name="std" type="number" value={params.revenue.energyProduction.std} onChange={(e) => handleChange(e, 'revenue.energyProduction')} fullWidth /></Grid>
          <Grid item xs={4}><TextField label="Degradation Rate" name="degradationRate" type="number" value={params.revenue.degradationRate} onChange={(e) => handleChange(e, 'revenue')} fullWidth /></Grid>
          <Grid item xs={12}>
            <TextField label="Power Price Type" name="type" select value={params.revenue.powerPrice.type} onChange={(e) => handleChange(e, 'revenue.powerPrice')} SelectProps={{ native: true }} fullWidth>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </TextField>
          </Grid>
          {params.revenue.powerPrice.type === 'fixed' ? (
            <Grid item xs={12}><TextField label="Power Price ($/MWh)" name="value" type="number" value={params.revenue.powerPrice.value} onChange={(e) => handleChange(e, 'revenue.powerPrice')} fullWidth /></Grid>
          ) : (
            <>
              <Grid item xs={4}><TextField label="Min ($/MWh)" name="min" type="number" value={params.revenue.powerPrice.min} onChange={(e) => handleChange(e, 'revenue.powerPrice')} fullWidth /></Grid>
              <Grid item xs={4}><TextField label="Mode ($/MWh)" name="mode" type="number" value={params.revenue.powerPrice.mode} onChange={(e) => handleChange(e, 'revenue.powerPrice')} fullWidth /></Grid>
              <Grid item xs={4}><TextField label="Max ($/MWh)" name="max" type="number" value={params.revenue.powerPrice.max} onChange={(e) => handleChange(e, 'revenue.powerPrice')} fullWidth /></Grid>
            </>
          )}
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Other Revenue</Typography>
          {params.revenue.otherRevenue.map((rev, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mt: 1 }}>
              <Grid item xs={6}><TextField label="Description" name="description" value={rev.description} onChange={(e) => handleChange(e, 'revenue.otherRevenue', idx)} fullWidth /></Grid>
              <Grid item xs={4}><TextField label="Annual Amount ($)" name="annualAmount" type="number" value={rev.annualAmount} onChange={(e) => handleChange(e, 'revenue.otherRevenue', idx)} fullWidth /></Grid>
              <Grid item xs={1}><IconButton onClick={() => removeItem('revenue.otherRevenue', idx)}><RemoveIcon /></IconButton></Grid>
            </Grid>
          ))}
          <Button onClick={() => addItem('revenue.otherRevenue')} startIcon={<AddIcon />}>Add Revenue</Button>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}><TextField label="Equity Investment ($)" name="equityInvestment" type="number" value={params.financing.equityInvestment} onChange={(e) => handleChange(e, 'financing')} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Target IRR" name="targetIRR" type="number" value={params.financing.targetIRR} onChange={(e) => handleChange(e, 'financing')} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Min DSCR" name="minDSCR" type="number" value={params.financing.minDSCR} onChange={(e) => handleChange(e, 'financing')} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Reserve Months" name="reserveMonths" type="number" value={params.financing.reserveMonths} onChange={(e) => handleChange(e, 'financing')} fullWidth /></Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Debt Service Schedule ($/year)</Typography>
            <Grid container spacing={1}>
              {params.financing.debtService.map((ds, idx) => (
                <Grid item xs={3} key={idx}>
                  <TextField label={`Year ${idx + 1}`} value={ds} onChange={(e) => setParams(prev => ({
                    ...prev,
                    financing: { ...prev.financing, debtService: prev.financing.debtService.map((v, i) => i === idx ? Number(e.target.value) : v) }
                  }))} fullWidth />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}><TextField label="Iterations" name="iterations" type="number" value={params.simulation.iterations} onChange={(e) => handleChange(e, 'simulation')} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Random Seed" name="seed" type="number" value={params.simulation.seed} onChange={(e) => handleChange(e, 'simulation')} fullWidth /></Grid>
          <Box sx={{ mt: 2, width: '100%' }}>
            <IconButton onClick={() => setAdvancedOpen(!advancedOpen)}>
              {advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography variant="body2" display="inline">Advanced Distributions</Typography>
            <Collapse in={advancedOpen}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}><TextField label="Cost Escalation" name="costEscalation" select value={params.simulation.distributions.costEscalation} onChange={(e) => handleChange(e, 'simulation.distributions')} SelectProps={{ native: true }} fullWidth>
                  <option value="normal">Normal</option>
                  <option value="weibull">Weibull</option>
                  <option value="triangle">Triangle</option>
                </TextField></Grid>
                <Grid item xs={6}><TextField label="Energy Production" name="energyProduction" select value={params.simulation.distributions.energyProduction} onChange={(e) => handleChange(e, 'simulation.distributions')} SelectProps={{ native: true }} fullWidth>
                  <option value="normal">Normal</option>
                  <option value="weibull">Weibull</option>
                  <option value="triangle">Triangle</option>
                </TextField></Grid>
                <Grid item xs={6}><TextField label="Power Price" name="powerPrice" select value={params.simulation.distributions.powerPrice} onChange={(e) => handleChange(e, 'simulation.distributions')} SelectProps={{ native: true }} fullWidth>
                  <option value="normal">Normal</option>
                  <option value="weibull">Weibull</option>
                  <option value="triangle">Triangle</option>
                </TextField></Grid>
              </Grid>
            </Collapse>
          </Box>
        </Grid>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleRun} disabled={loading}>
          {loading ? 'Running...' : 'Run Simulation'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ConfigPanel;