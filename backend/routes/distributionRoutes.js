// backend/routes/distributionRoutes.js
const express = require('express');
const router = express.Router();
const { simulateDistribution } = require('../controllers/distributionController');

// POST /api/distributions/simulate - Run simulation for a distribution
router.post('/simulate', simulateDistribution);

// POST /api/distributions/timeseries - Simulate a time series for a distribution
router.post('/timeseries', simulateDistribution);

module.exports = router;