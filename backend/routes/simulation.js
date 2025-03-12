// backend/routes/simulation.js
const express = require('express');
const router = express.Router();
const { runSimulation } = require('../simulation/monte_carlo');

router.post('/', async (req, res) => {
  try {
    const params = req.body;
    const result = runSimulation(params); // Use runSimulation, not runMonteCarloSimulation
    res.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;