// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  runFullSimulation,
  runInputSimulationOnly,
  runOutputSimulationOnly
} = require('../controllers/simulationController');
const validateSimulation = require('../middlewares/validateSimulation');

// POST /api/simulate - Run full simulation
router.post('/', validateSimulation, runFullSimulation);

// POST /api/simulate/input - Run only the input part of the simulation
router.post('/input', validateSimulation, runInputSimulationOnly);

// POST /api/simulate/output - Run only the output part of the simulation
router.post('/output', validateSimulation, runOutputSimulationOnly);

module.exports = router;