// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  runFullSimulation,
  runInputSimulationOnly,
  runOutputSimulationOnly
} = require('../controllers/simulationController');

// POST /api/simulate - Run full simulation
router.post('/', runFullSimulation);

// POST /api/simulate/input - Run only the input part of the simulation
router.post('/input', runInputSimulationOnly);

// POST /api/simulate/output - Run only the output part of the simulation
router.post('/output', runOutputSimulationOnly);

module.exports = router;