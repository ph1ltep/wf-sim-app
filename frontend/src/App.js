// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import Dashboard from './pages/Dashboard';
import SimulationPage from './pages/SimulationPage';
import ScenarioList from './pages/ScenarioList';
import './App.css';

function App() {
  return (
    <SimulationProvider>
      <Router basename="/proxy/3000">
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulate" element={<SimulationPage />} />
            <Route path="/scenarios" element={<ScenarioList onCompare={(scenarios) => { /* Handle comparison */ }} />} />
          </Routes>
        </div>
      </Router>
    </SimulationProvider>
  );
}

export default App;