// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  runFullSimulation
} = require('../controllers/simulationController');
const { getDefaults } = require('../controllers/defaultsController');

// POST /api/simulate - Run full simulation
router.post('/', runFullSimulation);

// GET /api/simulate/defaults - Get default parameters
router.get('/defaults', getDefaults);

module.exports = router;