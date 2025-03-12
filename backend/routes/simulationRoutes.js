// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  runFullSimulation,
  getDefaultParameters
} = require('../controllers/simulationController');

// POST /api/simulate - Run full simulation
router.post('/', runFullSimulation);

// GET /api/simulate/defaults - Get default parameters
router.get('/defaults', getDefaultParameters);

module.exports = router;