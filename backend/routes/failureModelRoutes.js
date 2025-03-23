// backend/routes/failureModelRoutes.js
const express = require('express');
const router = express.Router();
const {
  generateFailureModels,
  getFailureModels,
  updateFailureModel
} = require('../controllers/failureModelController');

// GET /api/scenarios/:scenarioId/failure-models - Get all failure models for a scenario
router.get('/:scenarioId/failure-models', getFailureModels);

// POST /api/scenarios/:scenarioId/failure-models/generate - Generate default failure models
router.post('/:scenarioId/failure-models/generate', generateFailureModels);

// PUT /api/scenarios/:scenarioId/failure-models/:modelIndex - Update a specific failure model
router.put('/:scenarioId/failure-models/:modelIndex', updateFailureModel);

module.exports = router;