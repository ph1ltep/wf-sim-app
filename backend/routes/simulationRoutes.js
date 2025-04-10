// backend/routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const { validateMiddleware } = require('../utils/validate');
const { SimRequestSchema } = require('../../schemas/yup/distribution'); // Assuming this schema exists
const {
  runSimulation,
  getSimulationResults
} = require('../controllers/simulationController');

// POST /api/simulations - Run a simulation
// Updated to use validateMiddleware with SimRequestSchema
router.post('/', validateMiddleware(SimRequestSchema), runSimulation);

// GET /api/simulations/:id - Get simulation results
router.get('/:id', getSimulationResults);

module.exports = router;