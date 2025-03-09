import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button } from '@mui/material';

const Dashboard = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Wind Farm Simulation Dashboard
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/simulation">
        Start New Simulation
      </Button>
    </Container>
  );
};

export default Dashboard;
