// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ScenarioProvider } from './contexts/ScenarioContext';
import { CubeProvider } from './contexts/CubeContext';
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

// NEW: Simulations pages
import ExternalFactors from './pages/simulations/ExternalFactors';
import OperationalRisks from './pages/simulations/OperationalRisks';

// NEW: Analyses pages  
import Cashflow from './pages/analyses/Cashflow';
import Sensitivity from './pages/analyses/Sensitivity';

import './index.css';

function App() {
  const basename = process.env.REACT_APP_BASENAME || '/proxy/3000';
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
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

                {/* NEW: Simulations routes */}
                <Route path="simulations">
                  <Route path="external-factors" element={<ExternalFactors />} />
                  <Route path="operational-risks" element={<OperationalRisks />} />
                  <Route index element={<Navigate to="/simulations/external-factors" replace />} />
                </Route>

                {/* NEW: Analyses routes */}
                <Route path="analyses">
                  <Route path="cashflow" element={<Cashflow />} />
                  <Route path="sensitivity" element={<Sensitivity />} />
                  <Route index element={<Navigate to="/analyses/cashflow" replace />} />
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