// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const costRoutes = require('./costRoutes');
const revenueRoutes = require('./revenueRoutes');
const financingRoutes = require('./financingRoutes');
const riskRoutes = require('./riskRoutes');
const scenarioRoutes = require('./scenarioRoutes');
const simulationRoutes = require('./simulationRoutes');
const locationRoutes = require('./locationRoutes');
const oemScopeRoutes = require('./oemScopeRoutes');
const oemContractRoutes = require('./oemContractRoutes');
const oemResponsibilityRoutes = require('./oemResponsibilityRoutes');

// Mount all routes
router.use('/cost', costRoutes);
router.use('/revenue', revenueRoutes);
router.use('/financing', financingRoutes);
router.use('/risk', riskRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/simulate', simulationRoutes);
router.use('/locations', locationRoutes);
router.use('/oemscopes', oemScopeRoutes);
router.use('/oemcontracts', oemContractRoutes);
router.use('/oemresponsibility', oemResponsibilityRoutes);

module.exports = router;