// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const {
    simulateDistributions,
    getDistributionsInfo,
    validateDistribution,
    fitDistribution
} = require('../controllers/simulationController');
const { validateMiddleware } = require('../utils/validate');
const { SimRequestSchema, DistributionTypeSchema, FitDistributionSchema } = require('../../schemas/yup/distribution');

// POST /api/simulation/simulate - Run simulation for one or more distributions
router.post('/simulate', validateMiddleware(SimRequestSchema), simulateDistributions);

// GET /api/simulation/info - Get metadata for all distributions
router.get('/info', getDistributionsInfo);

// POST /api/simulation/validate - Validate distribution parameters
router.post('/validate', validateMiddleware(DistributionTypeSchema), validateDistribution);

// POST /api/simulation/fit - Fit a distribution to data points
router.post('/fit', validateMiddleware(FitDistributionSchema), fitDistribution);

module.exports = router;