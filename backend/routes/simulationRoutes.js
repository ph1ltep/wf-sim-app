// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  runFullSimulation
} = require('../controllers/simulationController');
//const { getDefaults } = require('../controllers/defaultsController');
const defaultsController = require('../controllers/defaultsController');

// POST /api/simulate - Run full simulation
router.post('/', runFullSimulation);

// GET /api/simulate/defaults - Get default parameters
router.get('/defaults', defaultsController.getDefaults);

module.exports = router;