import React, { useState } from 'react';
import { Box, Button, TextField, Grid, IconButton, Typography } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { runSimulation } from '../services/api';

const ConfigPanel = ({ setSimulationResults }) => {
    const [formValues, setFormValues] = useState({
        years: 30,
        oemTerm: 10,
        fixedOM: 400000,
        baseOM: 500000,
        annualRevenue: 1000000,
        annualDebtService: 200000,
        escalationMean: 0.02,
        escalationStd: 0.005,
        initialInvestment: 1000000,
        iterations: 10000, // Default number of simulations
        riskEvents: [{ riskProbability: 0.1, riskCost: 100000, riskYear: 15 }]
    });

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: Number(e.target.value)
        });
    };

    const handleRiskEventChange = (index, field, value) => {
        const newRiskEvents = [...formValues.riskEvents];
        newRiskEvents[index][field] = Number(value);
        setFormValues({ ...formValues, riskEvents: newRiskEvents });
    };

    const addRiskEvent = () => {
        setFormValues({
            ...formValues,
            riskEvents: [...formValues.riskEvents, { riskProbability: 0.1, riskCost: 100000, riskYear: 15 }]
        });
    };

    const removeRiskEvent = (index) => {
        const newRiskEvents = formValues.riskEvents.filter((_, i) => i !== index);
        setFormValues({ ...formValues, riskEvents: newRiskEvents });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formValues.initialInvestment || formValues.annualDebtService <= 0) {
            alert("Please provide valid values for initial investment and annual debt service.");
            return;
        }
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
                        label="Total Project Years"
                        name="years"
                        type="number"
                        value={formValues.years}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="O&M Term (Years)"
                        name="oemTerm"
                        type="number"
                        value={formValues.oemTerm}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Fixed O&M Cost ($)"
                        name="fixedOM"
                        type="number"
                        value={formValues.fixedOM}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Base O&M Cost ($)"
                        name="baseOM"
                        type="number"
                        value={formValues.baseOM}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Annual Revenue ($)"
                        name="annualRevenue"
                        type="number"
                        value={formValues.annualRevenue}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Annual Debt Service ($)"
                        name="annualDebtService"
                        type="number"
                        value={formValues.annualDebtService}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Escalation Mean"
                        name="escalationMean"
                        type="number"
                        value={formValues.escalationMean}
                        onChange={handleChange}
                        fullWidth
                        step="0.001"
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Escalation Std Dev"
                        name="escalationStd"
                        type="number"
                        value={formValues.escalationStd}
                        onChange={handleChange}
                        fullWidth
                        step="0.001"
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Initial Investment ($)"
                        name="initialInvestment"
                        type="number"
                        value={formValues.initialInvestment}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Grid>
                {/* New field for number of simulations */}
                <Grid item xs={6}>
                    <TextField
                        label="Number of Simulations"
                        name="iterations"
                        type="number"
                        value={formValues.iterations}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 1, step: 1 }}
                    />
                </Grid>
            </Grid>
            <Typography variant="h6" sx={{ mt: 2 }}>
                Risk Events
            </Typography>
            {formValues.riskEvents.map((event, index) => (
                <Grid container spacing={2} key={index} sx={{ mt: 1 }}>
                    <Grid item xs={3}>
                        <TextField
                            label="Probability"
                            type="number"
                            value={event.riskProbability}
                            onChange={(e) => handleRiskEventChange(index, 'riskProbability', e.target.value)}
                            fullWidth
                            inputProps={{ step: 0.01, min: 0, max: 1 }}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            label="Cost ($)"
                            type="number"
                            value={event.riskCost}
                            onChange={(e) => handleRiskEventChange(index, 'riskCost', e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            label="Year"
                            type="number"
                            value={event.riskYear}
                            onChange={(e) => handleRiskEventChange(index, 'riskYear', e.target.value)}
                            fullWidth
                            inputProps={{ min: 1, max: formValues.years }}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <IconButton onClick={() => removeRiskEvent(index)}>
                            <Remove />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}
            <Button onClick={addRiskEvent} startIcon={<Add />} sx={{ mt: 2 }}>
                Add Risk Event
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, ml: 2 }}>
                Run Simulation
            </Button>
        </Box>
    );
};

export default ConfigPanel;