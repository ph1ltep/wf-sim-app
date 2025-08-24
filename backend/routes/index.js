// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const scenarioRoutes = require('./scenarioRoutes');
const locationRoutes = require('./locationRoutes');
const oemScopeRoutes = require('./oemScopeRoutes');
const majorComponentRoutes = require('./majorComponentRoutes');
const failureModelRoutes = require('./failureModelRoutes');
const defaultsRoutes = require('./defaultsRoutes');
const simulationRoutes = require('./simulationRoutes');
const repairPackageRoutes = require('./repairPackageRoutes');

// Mount routes
router.use('/scenarios', scenarioRoutes);
router.use('/scenarios', failureModelRoutes);
router.use('/locations', locationRoutes);
router.use('/oemscopes', oemScopeRoutes);
router.use('/components', majorComponentRoutes);
router.use('/defaults', defaultsRoutes);
router.use('/simulation', simulationRoutes);
router.use('/repair-packages', repairPackageRoutes);

module.exports = router;