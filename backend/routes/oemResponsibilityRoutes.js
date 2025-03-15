// backend/routes/oemResponsibilityRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getResponsibilityMatrix,
  generateMatrixForContracts
} = require('../controllers/oemResponsibilityController');

// GET /api/oemresponsibility - Get responsibility matrix for all contracts
router.get('/', getResponsibilityMatrix);

// POST /api/oemresponsibility/generate - Generate matrix for specific contracts
router.post('/generate', generateMatrixForContracts);

module.exports = router;