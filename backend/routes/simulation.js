// backend/routes/simulation.js
const express = require('express');
const { runMonteCarloSimulation } = require('../simulation/monte_carlo.js');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const params = req.body;
    const results = runMonteCarloSimulation(params);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;