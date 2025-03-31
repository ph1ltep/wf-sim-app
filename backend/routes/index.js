// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const scenarioRoutes = require('./scenarioRoutes');
const simulationRoutes = require('./simulationRoutes');
const locationRoutes = require('./locationRoutes');
const oemScopeRoutes = require('./oemScopeRoutes');
const majorComponentRoutes = require('./majorComponentRoutes');
const failureModelRoutes = require('./failureModelRoutes');
const defaultsRoutes = require('./defaultsRoutes'); // Add this line

// Mount routes
router.use('/scenarios', scenarioRoutes);
router.use('/scenarios', failureModelRoutes); // Mounting on /scenarios path for nested resources
router.use('/simulate', simulationRoutes);
router.use('/locations', locationRoutes);
router.use('/oemscopes', oemScopeRoutes);
router.use('/components', majorComponentRoutes);
router.use('/defaults', defaultsRoutes); // Add this line

module.exports = router;