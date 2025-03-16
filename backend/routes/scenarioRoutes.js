// backend/routes/scenarioRoutes.js
const express = require('express');
const router = express.Router();
const {
  createScenario,
  getAllScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
  compareScenarios
} = require('../controllers/scenarioController');
const validateScenario = require('../middlewares/validateScenario');

// GET /api/scenarios - Get all scenarios
router.get('/', getAllScenarios);

// POST /api/scenarios - Create new scenario
router.post('/', validateScenario, createScenario);

// GET /api/scenarios/:id - Get single scenario
router.get('/:id', getScenarioById);

// PUT /api/scenarios/:id - Update scenario
router.put('/:id', validateScenario, updateScenario);

// DELETE /api/scenarios/:id - Delete scenario
router.delete('/:id', deleteScenario);

// POST /api/scenarios/compare - Compare multiple scenarios
router.post('/compare', compareScenarios);

module.exports = router;