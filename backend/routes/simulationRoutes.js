// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  runFullSimulation,
  getDefaultParameters,
  runCostModule,
  runRevenueModule,
  runFinancingModule,
  runRiskModule
} = require('../controllers/simulationController');

// POST /api/simulate - Run full simulation
router.post('/', runFullSimulation);

// GET /api/simulate/defaults - Get default parameters
router.get('/defaults', getDefaultParameters);

// POST /api/simulate/cost - Run cost module
router.post('/cost', runCostModule);

// POST /api/simulate/revenue - Run revenue module
router.post('/revenue', runRevenueModule);

// POST /api/simulate/financing - Run financing module
router.post('/financing', runFinancingModule);

// POST /api/simulate/risk - Run risk module
router.post('/risk', runRiskModule);

module.exports = router;