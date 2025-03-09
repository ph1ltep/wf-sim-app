// frontend/src/pages/ScenarioList.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Button, Stack } from '@mui/material';
import { getScenarios, deleteScenario, getScenario } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { SimulationContext } from '../context/SimulationContext';

const ScenarioList = () => {
  const [scenarios, setScenarios] = useState([]);
  const navigate = useNavigate();
  const { setSimulationData } = useContext(SimulationContext);

  const fetchScenarios = async () => {
    try {
      const response = await getScenarios();
      if (response.success) {
        setScenarios(response.scenarios);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      await deleteScenario(id);
      fetchScenarios();
    }
  };

  const handleLoad = async (id) => {
    try {
      const response = await getScenario(id);
      if (response.success) {
        setSimulationData({ params: response.scenario.parameters, results: response.scenario.results });
        navigate('/simulate');
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Saved Simulation Scenarios
      </Typography>
      {scenarios.length === 0 ? (
        <Typography>No scenarios saved yet.</Typography>
      ) : (
        <List>
          {scenarios.map((sc) => (
            <ListItem key={sc._id} secondaryAction={
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => handleLoad(sc._id)}>Load</Button>
                <Button variant="contained" color="error" onClick={() => handleDelete(sc._id)}>Delete</Button>
              </Stack>
            }>
              <ListItemText
                primary={sc.name}
                secondary={`Created: ${new Date(sc.createdAt).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ScenarioList;
