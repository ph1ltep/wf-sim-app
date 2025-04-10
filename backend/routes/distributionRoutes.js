// backend/routes/distributionRoutes.js
const express = require('express');
const router = express.Router();
const {
    simulateDistributions,
    simulateDistribution,
    getDistributionsInfo,
    validateDistribution,
    fitDistribution
} = require('../controllers/distributionController');
const { validateMiddleware } = require('../utils/validate');
const { SimRequestSchema } = require('../../schemas/yup/distribution');

// POST /api/v2/distributions/simulate - Run simulation for multiple distributions
router.post('/simulate', validateMiddleware(SimRequestSchema), simulateDistributions);

// POST /api/v2/distributions/simulate-single - Run simulation for a single distribution
router.post('/simulate-single', validateMiddleware(SimRequestSchema), simulateDistribution);

// GET /api/v2/distributions/info - Get metadata for all distributions
router.get('/info', getDistributionsInfo);

// POST /api/v2/distributions/validate - Validate distribution parameters
router.post('/validate', validateDistribution);

// POST /api/v2/distributions/fit - Fit a distribution to data points
router.post('/fit', fitDistribution);

module.exports = router;