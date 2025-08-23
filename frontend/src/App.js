// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ScenarioProvider } from './contexts/ScenarioContext';
import { CubeProvider } from './contexts/CubeContext';
import { ConfigProvider, theme } from 'antd';
import MainLayout from './layouts/MainLayout';

// Configuration pages
import AppSettings from './pages/config/app/AppSettings';
import Locations from './pages/config/defaults/Locations';
import OMScopes from './pages/config/defaults/OMScopes';
import RepairPackages from './pages/config/defaults/RepairPackages';
import ProjectSettings from './pages/config/project/ProjectSettings';
import ScenarioSettings from './pages/config/scenario/ScenarioSettings';

// Scenario pages
import EquipmentSpecifications from './pages/scenario/equipment/Specifications';
import EquipmentLeadingEdge from './pages/scenario/equipment/LeadingEdge';
import EquipmentFailureRates from './pages/scenario/equipment/FailureRates';
import Investment from './pages/scenario/economics/Investment';
import EconomicsRevenue from './pages/scenario/economics/Revenue';
import MarketFactors from './pages/scenario/economics/MarketFactors';
import ServiceContracts from './pages/scenario/operations/ServiceContracts';
import OperatingCosts from './pages/scenario/operations/OperatingCosts';
import Performance from './pages/scenario/operations/Performance';
import Financing from './pages/scenario/financing/Financing';
import RiskMitigations from './pages/scenario/risk/Mitigations';
import RiskWarranties from './pages/scenario/risk/Warranties';

// Simulations pages
import ExternalFactors from './pages/simulations/ExternalFactors';
import OperationalRisks from './pages/simulations/OperationalRisks';

// Analyses pages  
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
                {/* Default redirect to app settings */}
                <Route index element={<Navigate to="/config/app-settings" replace />} />

                {/* Configuration routes */}
                <Route path="config">
                  <Route path="app-settings" element={<AppSettings />} />
                  <Route path="defaults">
                    <Route path="locations" element={<Locations />} />
                    <Route path="omscopes" element={<OMScopes />} />
                    <Route path="repair-packages" element={<RepairPackages />} />
                    <Route index element={<Navigate to="/config/defaults/locations" replace />} />
                  </Route>
                  <Route path="project-settings" element={<ProjectSettings />} />
                  <Route path="scenario-settings" element={<ScenarioSettings />} />
                  <Route index element={<Navigate to="/config/app-settings" replace />} />
                </Route>

                {/* Scenario routes */}
                <Route path="scenario">
                  <Route path="equipment">
                    <Route index element={<Navigate to="/scenario/equipment/specifications" replace />} />
                    <Route path="specifications" element={<EquipmentSpecifications />} />
                    <Route path="leading-edge" element={<EquipmentLeadingEdge />} />
                    <Route path="failure-rates" element={<EquipmentFailureRates />} />
                  </Route>
                  <Route path="economics">
                    <Route index element={<Navigate to="/scenario/economics/investment" replace />} />
                    <Route path="investment" element={<Investment />} />
                    <Route path="revenue" element={<EconomicsRevenue />} />
                    <Route path="market-factors" element={<MarketFactors />} />
                  </Route>
                  <Route path="operations">
                    <Route index element={<Navigate to="/scenario/operations/service-contracts" replace />} />
                    <Route path="service-contracts" element={<ServiceContracts />} />
                    <Route path="operating-costs" element={<OperatingCosts />} />
                    <Route path="performance" element={<Performance />} />
                  </Route>
                  <Route path="financing" element={<Financing />} />
                  <Route path="risk">
                    <Route path="mitigations" element={<RiskMitigations />} />
                    <Route path="warranties" element={<RiskWarranties />} />
                    <Route index element={<Navigate to="/scenario/risk/mitigations" replace />} />
                  </Route>
                  <Route index element={<Navigate to="/scenario/economics" replace />} />
                </Route>

                {/* Simulations routes */}
                <Route path="simulations">
                  <Route path="external-factors" element={<ExternalFactors />} />
                  <Route path="operational-risks" element={<OperationalRisks />} />
                  <Route index element={<Navigate to="/simulations/external-factors" replace />} />
                </Route>

                {/* Analyses routes */}
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