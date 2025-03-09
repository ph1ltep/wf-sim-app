
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SimulationPage from './pages/SimulationPage';

function App() {
  return (
    <Router basename="/proxy/3000">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/simulation" element={<SimulationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
