import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SimulationPage from './pages/SimulationPage';
import ScenarioList from './pages/ScenarioList';
import { CssBaseline, Container } from '@mui/material';

const App = () => {
  // Optional: Uncomment if navigation is needed in this component
  // const navigate = useNavigate();

  return (
    <Router basename="/proxy/3000">
      <CssBaseline />
      <Container maxWidth="lg">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulate" element={<SimulationPage />} />
          <Route path="/scenarios" element={<ScenarioList />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;