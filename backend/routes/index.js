// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Import controllers directly for testing
const { getDefaults } = require('../controllers/defaultsController');

// Add a direct route for the defaults endpoint
router.get('/simulate/defaults', getDefaults);

// Then import and use the other routes as before
const costRoutes = require('./costRoutes');
const revenueRoutes = require('./revenueRoutes');
const financingRoutes = require('./financingRoutes');
const riskRoutes = require('./riskRoutes');
const scenarioRoutes = require('./scenarioRoutes');
const simulationRoutes = require('./simulationRoutes');
const locationRoutes = require('./locationRoutes');

// Mount all routes
router.use('/cost', costRoutes);
router.use('/revenue', revenueRoutes);
router.use('/financing', financingRoutes);
router.use('/risk', riskRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/simulate', simulationRoutes);
router.use('/locations', locationRoutes);

module.exports = router;