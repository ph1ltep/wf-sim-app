// frontend/src/pages/ScenarioList.jsx
import React, { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Button, Stack, Checkbox } from '@mui/material';
import { getScenarios, deleteScenario } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ScenarioList = ({ onCompare }) => {
  const [scenarios, setScenarios] = useState([]);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScenarios = async () => {
      const response = await getScenarios();
      if (response.success) setScenarios(response.scenarios);
    };
    fetchScenarios();
  }, []);

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleCompare = () => {
    const selectedScenarios = scenarios.filter(s => selected.includes(s._id));
    onCompare(selectedScenarios);
    navigate('/simulate');
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Saved Scenarios</Typography>
      {scenarios.length === 0 ? (
        <Typography>No scenarios saved.</Typography>
      ) : (
        <>
          <List>
            {scenarios.map(sc => (
              <ListItem key={sc._id} secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => navigate('/simulate', { state: { scenario: sc } })}>Load</Button>
                  <Button variant="contained" color="error" onClick={() => deleteScenario(sc._id).then(() => setScenarios(prev => prev.filter(s => s._id !== sc._id)))}>Delete</Button>
                </Stack>
              }>
                <Checkbox checked={selected.includes(sc._id)} onChange={() => handleSelect(sc._id)} />
                <ListItemText primary={sc.name} secondary={`Created: ${new Date(sc.createdAt).toLocaleString()}`} />
              </ListItem>
            ))}
          </List>
          <Button variant="contained" onClick={handleCompare} disabled={selected.length < 2}>Compare Selected</Button>
        </>
      )}
    </Paper>
  );
};

export default ScenarioList;