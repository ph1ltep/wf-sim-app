// backend/routes/distributionRoutesV2.js
const express = require('express');
const router = express.Router();
const {
    simulateDistributions,
    simulateDistribution,
    getDistributionsInfo,
    validateDistribution,
    fitDistribution
} = require('../controllers/distributionController');

// POST /api/v2/distributions/simulate - Run simulation for multiple distributions
router.post('/simulate', simulateDistributions);

// POST /api/v2/distributions/simulate-single - Run simulation for a single distribution
router.post('/simulate-single', simulateDistribution);

// GET /api/v2/distributions/info - Get metadata for all distributions
router.get('/info', getDistributionsInfo);

// POST /api/v2/distributions/validate - Validate distribution parameters
router.post('/validate', validateDistribution);

// POST /api/v2/distributions/fit - Fit a distribution to data points
router.post('/fit', fitDistribution);

module.exports = router;