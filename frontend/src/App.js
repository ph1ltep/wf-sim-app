// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SimulationProvider } from './contexts/SimulationContext';
import MainLayout from './layouts/MainLayout';

// Config components
import GeneralConfig from './components/config/GeneralConfig';
import SimulationConfig from './components/config/SimulationConfig';

// Input components
import CostInputs from './components/inputs/CostInputs';
import RevenueInputs from './components/inputs/RevenueInputs';
import FinancingInputs from './components/inputs/FinancingInputs';
import RiskInputs from './components/inputs/RiskInputs';

// Results components
import Overview from './components/results/Overview';
import CostBreakdown from './components/results/CostBreakdown';
import RevenueAnalysis from './components/results/RevenueAnalysis';
import CashFlowChart from './components/results/CashFlowChart';
import IRRDistribution from './components/results/IRRDistribution';
import ScenarioComparison from './components/results/ScenarioComparison';

import './index.css';

const PUBLIC_URL = process.env.PUBLIC_URL || '/absproxy/3000';

function App() {
  return (
    <SimulationProvider>
      <Router basename="/proxy/3000">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Default redirect to general config */}
            <Route index element={<Navigate to="/config/general" replace />} />
            
            {/* Configuration routes */}
            <Route path="config">
              <Route path="general" element={<GeneralConfig />} />
              <Route path="simulation" element={<SimulationConfig />} />
            </Route>
            
            {/* Input routes */}
            <Route path="input">
              <Route path="cost" element={<CostInputs />} />
              <Route path="revenue" element={<RevenueInputs />} />
              <Route path="financing" element={<FinancingInputs />} />
              <Route path="risk" element={<RiskInputs />} />
            </Route>
            
            {/* Results routes */}
            <Route path="results">
              <Route path="overview" element={<Overview />} />
              <Route path="cost" element={<CostBreakdown />} />
              <Route path="revenue" element={<RevenueAnalysis />} />
              <Route path="cashflow" element={<CashFlowChart />} />
              <Route path="irr" element={<IRRDistribution />} />
              <Route path="scenarios" element={<ScenarioComparison />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </SimulationProvider>
  );
}

export default App;