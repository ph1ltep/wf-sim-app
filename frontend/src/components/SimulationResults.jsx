import React from 'react';
import { Box, Typography } from '@mui/material';
import ChartDisplay from './ChartDisplay';

const SimulationResults = ({ results }) => {
    if (!results) return null;

    const minDscr = results.averageDscr && results.averageDscr.length > 0 
        ? Math.min(...results.averageDscr).toFixed(2) 
        : 'N/A';

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Simulation Results
            </Typography>
            <Typography>
                Average IRR: {results.averageIRR !== null ? `${(results.averageIRR * 100).toFixed(2)}%` : 'N/A'}
            </Typography>
            <Typography>
                Minimum Average DSCR: {minDscr}
            </Typography>
            <ChartDisplay
                irrDistribution={results.irrDistribution}
                averageCashflow={results.averageCashflow}
                averageDscr={results.averageDscr}
            />
        </Box>
    );
};

export default SimulationResults;