// backend/routes/oemScopeRoutes.js
const express = require('express');
const router = express.Router();
const { OEMScopeSchema } = require('../../schemas/yup/oemScope');
const { validateMiddleware } = require('../utils/validate');
const {
  getAllOEMScopes,
  getOEMScopeById,
  createOEMScope,
  generateName,
  updateOEMScope,
  deleteOEMScope
} = require('../controllers/oemScopeController');

// GET /api/oemscopes - Get all OEM scopes
router.get('/', getAllOEMScopes);

// GET /api/oemscopes/:id - Get OEM scope by ID
router.get('/:id', getOEMScopeById);

// POST /api/oemscopes - Create a new OEM scope
router.post('/', validateMiddleware(OEMScopeSchema), createOEMScope);

// POST /api/oemscopes/generate-name - Generate a name based on scope selections
router.post('/generate-name', validateMiddleware(OEMScopeSchema), generateName);

// PUT /api/oemscopes/:id - Update OEM scope
router.put('/:id', validateMiddleware(OEMScopeSchema), updateOEMScope);

// DELETE /api/oemscopes/:id - Delete OEM scope
router.delete('/:id', deleteOEMScope);

module.exports = router;