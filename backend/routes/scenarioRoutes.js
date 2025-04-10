// backend/routes/scenarioRoutes.js
const express = require('express');
const router = express.Router();
const { validateMiddleware } = require('../utils/validate');
const { ScenarioSchema } = require('../../schemas/yup/scenario');
const {
  getAllScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario
} = require('../controllers/scenarioController');

// GET /api/scenarios - Get all scenarios
router.get('/', getAllScenarios);

// GET /api/scenarios/:id - Get a specific scenario
router.get('/:id', getScenarioById);

// POST /api/scenarios - Create a new scenario
// Updated to use validateMiddleware with ScenarioSchema
router.post('/', validateMiddleware(ScenarioSchema), createScenario);

// PUT /api/scenarios/:id - Update a scenario
// Updated to use validateMiddleware with ScenarioSchema
router.put('/:id', validateMiddleware(ScenarioSchema), updateScenario);

// DELETE /api/scenarios/:id - Delete a scenario
router.delete('/:id', deleteScenario);

module.exports = router;