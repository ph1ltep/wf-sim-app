// backend/routes/simulation.js
const express = require('express');
const router = express.Router();
const { runSimulation } = require('../simulation/monte_carlo');

// POST /api/simulate
router.post('/', (req, res) => {
  const simulationParams = req.body;
  
  // Run the simulation with default 10,000 iterations
  const results = runSimulation(simulationParams, 10000);
  res.json(results);
});

module.exports = router;
