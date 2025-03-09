// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { Typography, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <Stack spacing={3} sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h3">Wind Farm O&M Simulator</Typography>
      <Button variant="contained" component={Link} to="/simulate">
        Run New Simulation
      </Button>
      <Button variant="outlined" component={Link} to="/scenarios">
        View Saved Scenarios
      </Button>
    </Stack>
  );
};

export default Dashboard;
