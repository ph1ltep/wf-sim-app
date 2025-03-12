// frontend/src/components/ConfigPanel.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Grid, Paper, Tabs, Tab, MenuItem } from '@mui/material';
import { runSimulation } from '../services/api';

const defaultParams = {
  general: { projectLife: 20, loanDuration: 15 },
  financing: {
    capex: 50000000,
    devex: 10000000,
    model: 'Balance-Sheet',
    debtToEquityRatio: 1.5,
    debtToCapexRatio: 0.7,
    loanInterestRateBS: 5,
    loanInterestRatePF: 6,
    equityInvestment: 20000000,
  },
  cost: {
    annualBaseOM: 5000000,
    escalationRate: 2,
    escalationDistribution: 'Normal',
    oemTerm: 5,
    fixedOMFee: 4000000,
    failureEventProbability: 5,
    failureEventCost: 200000,
  },
  revenue: {
    energyProduction: { distribution: 'Normal', mean: 1000, std: 100 },
    electricityPrice: { type: 'fixed', value: 50 },
    revenueDegradationRate: 0.5,
    downtimePerEvent: { distribution: 'Weibull', scale: 24, shape: 2 },
    windVariabilityMethod: 'Default',
    turbulenceIntensity: 10,
    surfaceRoughness: 0.03,
    kaimalScale: 8.1,
  },
  riskMitigation: {
    insuranceEnabled: false,
    insurancePremium: 50000,
    insuranceDeductible: 10000,
  },
  simulation: { iterations: 10000, seed: 42 },
  annualAdjustments: Array(20).fill().map(() => ({ additionalOM: 0, additionalRevenue: 0 })),
};

const ConfigPanel = ({ onRunSimulation, initialParams }) => {
  const [params, setParams] = useState(initialParams || defaultParams);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const handleChange = (section, field, value, subField = null) => {
    setParams(prev => {
      if (subField) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: { ...prev[section][field], [subField]: value },
          },
        };
      }
      return { ...prev, [section]: { ...prev[section], [field]: value } };
    });
  };

  const handleAnnualChange = (index, field, value) => {
    setParams(prev => ({
      ...prev,
      annualAdjustments: prev.annualAdjustments.map((adj, i) =>
        i === index ? { ...adj, [field]: Number(value) } : adj
      ),
    }));
  };

  const handleRun = async () => {
    try {
      const response = await runSimulation(params);
      if (response.success) onRunSimulation(params, response.results);
    } catch (error) {
      alert('Simulation error: ' + error.message);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
        <Tab label="General" />
        <Tab label="Financing" />
        <Tab label="Cost" />
        <Tab label="Revenue" />
        <Tab label="Risk Mitigation" />
        <Tab label="Simulation" />
        <Tab label="Adjustments" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Project Life (years)"
              type="number"
              value={params.general.projectLife}
              onChange={(e) => handleChange('general', 'projectLife', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Loan Duration (years)"
              type="number"
              value={params.general.loanDuration}
              onChange={(e) => handleChange('general', 'loanDuration', Number(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="CAPEX ($)"
              type="number"
              value={params.financing.capex}
              onChange={(e) => handleChange('financing', 'capex', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="DEVEX ($)"
              type="number"
              value={params.financing.devex}
              onChange={(e) => handleChange('financing', 'devex', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Financing Model"
              select
              value={params.financing.model}
              onChange={(e) => handleChange('financing', 'model', e.target.value)}
              fullWidth
            >
              <MenuItem value="Balance-Sheet">Balance-Sheet</MenuItem>
              <MenuItem value="Project-Finance">Project-Finance</MenuItem>
            </TextField>
          </Grid>
          {params.financing.model === 'Balance-Sheet' && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Debt-to-Equity Ratio"
                  type="number"
                  value={params.financing.debtToEquityRatio}
                  onChange={(e) => handleChange('financing', 'debtToEquityRatio', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Loan Interest Rate (%)"
                  type="number"
                  value={params.financing.loanInterestRateBS}
                  onChange={(e) => handleChange('financing', 'loanInterestRateBS', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </>
          )}
          {params.financing.model === 'Project-Finance' && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Debt-to-CAPEX Ratio"
                  type="number"
                  value={params.financing.debtToCapexRatio}
                  onChange={(e) => handleChange('financing', 'debtToCapexRatio', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Loan Interest Rate (%)"
                  type="number"
                  value={params.financing.loanInterestRatePF}
                  onChange={(e) => handleChange('financing', 'loanInterestRatePF', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </>
          )}
          <Grid item xs={6}>
            <TextField
              label="Equity Investment ($)"
              type="number"
              value={params.financing.equityInvestment}
              onChange={(e) => handleChange('financing', 'equityInvestment', Number(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Annual Base O&M ($/year)"
              type="number"
              value={params.cost.annualBaseOM}
              onChange={(e) => handleChange('cost', 'annualBaseOM', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Escalation Rate (%)"
              type="number"
              value={params.cost.escalationRate}
              onChange={(e) => handleChange('cost', 'escalationRate', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="OEM Term (years)"
              type="number"
              value={params.cost.oemTerm}
              onChange={(e) => handleChange('cost', 'oemTerm', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Fixed O&M Fee ($/year)"
              type="number"
              value={params.cost.fixedOMFee}
              onChange={(e) => handleChange('cost', 'fixedOMFee', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Failure Event Probability (%)"
              type="number"
              value={params.cost.failureEventProbability}
              onChange={(e) => handleChange('cost', 'failureEventProbability', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Failure Event Cost ($)"
              type="number"
              value={params.cost.failureEventCost}
              onChange={(e) => handleChange('cost', 'failureEventCost', Number(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Energy Production Distribution"
              select
              value={params.revenue.energyProduction.distribution}
              onChange={(e) => handleChange('revenue', 'energyProduction', e.target.value, 'distribution')}
              fullWidth
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Triangular">Triangular</MenuItem>
            </TextField>
          </Grid>
          {params.revenue.energyProduction.distribution === 'Normal' && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Energy Mean (MWh/year)"
                  type="number"
                  value={params.revenue.energyProduction.mean}
                  onChange={(e) => handleChange('revenue', 'energyProduction', Number(e.target.value), 'mean')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Energy Std Dev"
                  type="number"
                  value={params.revenue.energyProduction.std}
                  onChange={(e) => handleChange('revenue', 'energyProduction', Number(e.target.value), 'std')}
                  fullWidth
                />
              </Grid>
            </>
          )}
          {params.revenue.energyProduction.distribution === 'Triangular' && (
            <>
              <Grid item xs={4}>
                <TextField
                  label="Energy Min (MWh/year)"
                  type="number"
                  value={params.revenue.energyProduction.min}
                  onChange={(e) => handleChange('revenue', 'energyProduction', Number(e.target.value), 'min')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Energy Mode (MWh/year)"
                  type="number"
                  value={params.revenue.energyProduction.mode}
                  onChange={(e) => handleChange('revenue', 'energyProduction', Number(e.target.value), 'mode')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Energy Max (MWh/year)"
                  type="number"
                  value={params.revenue.energyProduction.max}
                  onChange={(e) => handleChange('revenue', 'energyProduction', Number(e.target.value), 'max')}
                  fullWidth
                />
              </Grid>
            </>
          )}
          <Grid item xs={6}>
            <TextField
              label="Electricity Price Type"
              select
              value={params.revenue.electricityPrice.type}
              onChange={(e) => handleChange('revenue', 'electricityPrice', e.target.value, 'type')}
              fullWidth
            >
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="variable">Variable</MenuItem>
            </TextField>
          </Grid>
          {params.revenue.electricityPrice.type === 'fixed' && (
            <Grid item xs={6}>
              <TextField
                label="Electricity Price ($/MWh)"
                type="number"
                value={params.revenue.electricityPrice.value}
                onChange={(e) => handleChange('revenue', 'electricityPrice', Number(e.target.value), 'value')}
                fullWidth
              />
            </Grid>
          )}
          <Grid item xs={6}>
            <TextField
              label="Revenue Degradation Rate (%)"
              type="number"
              value={params.revenue.revenueDegradationRate}
              onChange={(e) => handleChange('revenue', 'revenueDegradationRate', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Downtime Scale (hours)"
              type="number"
              value={params.revenue.downtimePerEvent.scale}
              onChange={(e) => handleChange('revenue', 'downtimePerEvent', Number(e.target.value), 'scale')}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Wind Variability Method"
              select
              value={params.revenue.windVariabilityMethod}
              onChange={(e) => handleChange('revenue', 'windVariabilityMethod', e.target.value)}
              fullWidth
            >
              <MenuItem value="Default">Default</MenuItem>
              <MenuItem value="Industry Standard">Industry Standard</MenuItem>
            </TextField>
          </Grid>
          {params.revenue.windVariabilityMethod === 'Industry Standard' && (
            <>
              <Grid item xs={4}>
                <TextField
                  label="Turbulence Intensity (%)"
                  type="number"
                  value={params.revenue.turbulenceIntensity}
                  onChange={(e) => handleChange('revenue', 'turbulenceIntensity', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Surface Roughness (m)"
                  type="number"
                  value={params.revenue.surfaceRoughness}
                  onChange={(e) => handleChange('revenue', 'surfaceRoughness', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Kaimal Scale (m)"
                  type="number"
                  value={params.revenue.kaimalScale}
                  onChange={(e) => handleChange('revenue', 'kaimalScale', Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </>
          )}
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Insurance Enabled"
              type="checkbox"
              checked={params.riskMitigation.insuranceEnabled}
              onChange={(e) => handleChange('riskMitigation', 'insuranceEnabled', e.target.checked)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Insurance Premium ($/year)"
              type="number"
              value={params.riskMitigation.insurancePremium}
              onChange={(e) => handleChange('riskMitigation', 'insurancePremium', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Insurance Deductible ($)"
              type="number"
              value={params.riskMitigation.insuranceDeductible}
              onChange={(e) => handleChange('riskMitigation', 'insuranceDeductible', Number(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 5 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Iterations"
              type="number"
              value={params.simulation.iterations}
              onChange={(e) => handleChange('simulation', 'iterations', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Random Seed"
              type="number"
              value={params.simulation.seed}
              onChange={(e) => handleChange('simulation', 'seed', Number(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 6 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {params.annualAdjustments.map((adj, idx) => (
            <Grid container key={idx} spacing={1}>
              <Grid item xs={6}>
                <TextField
                  label={`Year ${idx + 1} O&M ($)`}
                  type="number"
                  value={adj.additionalOM}
                  onChange={(e) => handleAnnualChange(idx, 'additionalOM', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={`Year ${idx + 1} Revenue ($)`}
                  type="number"
                  value={adj.additionalRevenue}
                  onChange={(e) => handleAnnualChange(idx, 'additionalRevenue', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleRun}>
          Run Simulation
        </Button>
      </Box>
    </Paper>
  );
};

export default ConfigPanel;