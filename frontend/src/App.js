// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ScenarioProvider } from './contexts/ScenarioContext';
import MainLayout from './layouts/MainLayout';

// Config components
import GeneralConfig from './components/config/GeneralConfig';
import ProjectSettings from './components/config/ProjectSettings';
import SimulationSettings from './components/config/SimulationSettings';
import LocationDefaults from './components/config/LocationDefaults';
import OEMScopes from './components/config/OEMScopes';
import OEMContracts from './components/config/OEMContracts';
import ScenarioSettings from './components/config/ScenarioSettings';

// Module configuration components
import CostInputs from './components/inputs/CostInputs';
import RevenueInputs from './components/inputs/RevenueInputs';
import FinancingInputs from './components/inputs/FinancingInputs';
import RiskInputs from './components/inputs/RiskInputs';

// Input analysis components
import CashflowAnalysis from './components/inputs/CashflowAnalysis';
import RiskAnalysis from './components/inputs/RiskAnalysis';

// Results components
import Overview from './components/results/Overview';
import CostBreakdown from './components/results/CostBreakdown';
import RevenueAnalysis from './components/results/RevenueAnalysis';
import CashFlowChart from './components/results/CashFlowChart';
import IRRDistribution from './components/results/IRRDistribution';
import ScenarioComparison from './components/results/ScenarioComparison';

import './index.css';

function App() {
  return (
    <ScenarioProvider>
      <Router basename="/proxy/3000">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Default redirect to simulation config */}
            <Route index element={<Navigate to="/config/general/simulation" replace />} />
            
            {/* Configuration routes */}
            <Route path="config">
              <Route path="general">
                <Route path="simulation" element={<SimulationSettings />} />
                <Route path="locations" element={<LocationDefaults />} />
                <Route path="oemscopes" element={<OEMScopes />} />
                <Route index element={<Navigate to="/config/general/simulation" replace />} />
              </Route>
              <Route path="project" element={<ProjectSettings />} />
              <Route path="scenario">
                <Route path="settings" element={<ScenarioSettings />} />
                <Route path="oemcontracts" element={<OEMContracts />} />
                <Route index element={<Navigate to="/config/scenario/settings" replace />} />
              </Route>
              
              {/* Module configuration routes */}
              <Route path="modules">
                <Route path="cost" element={<CostInputs />} />
                <Route path="revenue" element={<RevenueInputs />} />
                <Route path="financing" element={<FinancingInputs />} />
                <Route path="risk" element={<RiskInputs />} />
              </Route>
            </Route>
            
            {/* Input analysis routes */}
            <Route path="input">
              <Route path="cashflow" element={<CashflowAnalysis />} />
              <Route path="risk" element={<RiskAnalysis />} />
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
    </ScenarioProvider>
  );
}

export default App;