// backend/routes/scenarios.js (partial update)
const express = require('express');
const Simulation = require('../models/Simulation');
const { runMonteCarloSimulation } = require('../simulation/monte_carlo');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, parameters } = req.body;
    const results = runMonteCarloSimulation(parameters);
    const scenario = new Simulation({ name, parameters, results });
    await scenario.save();
    res.json({ success: true, scenario });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all simulation scenarios
router.get('/', async (req, res) => {
  try {
    const scenarios = await Simulation.find().sort({ createdAt: -1 });
    res.json({ success: true, scenarios });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific simulation scenario by ID
router.get('/:id', async (req, res) => {
  try {
    const scenario = await Simulation.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    res.json({ success: true, scenario });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a simulation scenario by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedScenario = await Simulation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedScenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    res.json({ success: true, scenario: updatedScenario });
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a simulation scenario by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedScenario = await Simulation.findByIdAndDelete(req.params.id);
    if (!deletedScenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    res.json({ success: true, message: 'Scenario deleted successfully' });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
