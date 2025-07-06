// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ScenarioProvider } from './contexts/ScenarioContext';
import { CashflowProvider } from './contexts/CashflowContext'; // Add this import
import { CubeProvider } from './contexts/CubeContext'; // Add CubeProvider import
import { ConfigProvider, theme } from 'antd';
import MainLayout from './layouts/MainLayout';

// Config components
import ProjectSettings from './components/config/ProjectSettings';
import SimulationSettings from './components/general/SimulationSettings';
import LocationDefaults from './components/general/LocationDefaults';
import OEMScopes from './components/general/OEMScopes';
import ContractsModule from './components/modules/ContractsModule';
import ScenarioSettings from './components/config/ScenarioSettings';

// Module configuration components
import CostModule from './components/modules/CostModule';
import RevenueModule from './components/modules/RevenueModule';
import FinancingModule from './components/modules/FinancingModule';
import RiskModule from './components/modules/RiskModule';

// Input analysis components
import CashflowAnalysis from './components/analysis/CashflowAnalysis';
import RiskAnalysis from './components/analysis/RiskAnalysis';
import DistributionAnalysis from 'components/analysis/DistributionAnalysis';

// Results components
import Overview from './components/results/Overview';
import CostBreakdown from './components/results/CostBreakdown';
import RevenueAnalysis from './components/results/RevenueAnalysis';
// REMOVED: import CashFlowChart from './components/results/CashFlowChart';
import IRRDistribution from './components/results/IRRDistribution';
import ScenarioComparison from './components/results/ScenarioComparison';

// NEW: Import our new cashflow analysis component
import NewCashflowAnalysis from './components/results/cashflow/CashflowAnalysis';

// Scenario management component
import ScenarioList from './components/scenarios/ScenarioList';

import './index.css';

function App() {
  const basename = process.env.REACT_APP_BASENAME || '/proxy/3000';
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff', // Your primary color
          // ... other token overrides
        },
      }}
    >
      <ScenarioProvider>
        <CubeProvider>
          <Router basename={basename}>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                {/* Default redirect to simulation config */}
                <Route index element={<Navigate to="/config/general/simulation" replace />} />

                <Route path="scenarios" element={<ScenarioList />} />

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
                    <Route path="oemcontracts" element={<ContractsModule />} />
                    <Route index element={<Navigate to="/config/scenario/settings" replace />} />
                  </Route>

                  {/* Module configuration routes */}
                  <Route path="modules">
                    <Route path="cost" element={<CostModule />} />
                    <Route path="revenue" element={<RevenueModule />} />
                    <Route path="financing" element={<FinancingModule />} />
                    <Route path="risk" element={<RiskModule />} />
                  </Route>
                </Route>

                {/* Input analysis routes */}
                <Route path="input">
                  <Route path="cashflow" element={<CashflowAnalysis />} />
                  <Route path="risk" element={<RiskAnalysis />} />
                  <Route path="distribution" element={<DistributionAnalysis />} />
                </Route>

                {/* Results routes */}
                <Route path="results">
                  <Route path="overview" element={<Overview />} />
                  <Route path="cost" element={<CostBreakdown />} />
                  <Route path="revenue" element={<RevenueAnalysis />} />
                  {/* REPLACED: Use new cashflow analysis component */}
                  <Route path="cashflow" element={<NewCashflowAnalysis />} />
                  <Route path="irr" element={<IRRDistribution />} />
                  <Route path="scenarios" element={<ScenarioComparison />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </CubeProvider>
      </ScenarioProvider>
    </ConfigProvider>
  );
}

export default App;