// backend/routes/simulation.js
const express = require('express');
const router = express.Router();
const { runSimulation } = require('../simulation/monte_carlo');

// POST /api/simulate - Run simulation (without saving configuration)
router.post('/', (req, res) => {
  const simulationParams = req.body;
  try {
    // Use the provided iterations value or default to 10,000
    const iterations = simulationParams.iterations || 10000;
    const results = runSimulation(simulationParams, iterations);
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error during simulation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
