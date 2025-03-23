// backend/routes/majorComponentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent
} = require('../controllers/majorComponentController');

// GET /api/components - Get all components
router.get('/', getAllComponents);

// GET /api/components/:id - Get component by ID
router.get('/:id', getComponentById);

// POST /api/components - Create a new component
router.post('/', createComponent);

// PUT /api/components/:id - Update component
router.put('/:id', updateComponent);

// DELETE /api/components/:id - Delete component
router.delete('/:id', deleteComponent);

module.exports = router;