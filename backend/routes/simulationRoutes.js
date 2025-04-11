// backend/routes/distributionRoutes.js
const express = require('express');
const router = express.Router();
const {
    simulateDistributions,
    simulateDistribution,
    getDistributionsInfo,
    validateDistribution,
    fitDistribution
} = require('../controllers/simulationController');
const { validateMiddleware } = require('../utils/validate');
const { SimRequestSchema } = require('../../schemas/yup/distribution');

// POST /api/simulation/simulate - Run simulation for multiple distributions
router.post('/simulate', validateMiddleware(SimRequestSchema), simulateDistributions);

// GET /api/simulation/info - Get metadata for all distributions
router.get('/info', getDistributionsInfo);

// POST /api/simulation/validate - Validate distribution parameters
router.post('/validate', validateDistribution);

// POST /api/simulation/fit - Fit a distribution to data points
router.post('/fit', fitDistribution);

module.exports = router;