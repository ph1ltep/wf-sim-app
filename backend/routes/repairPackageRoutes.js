// backend/routes/repairPackageRoutes.js
const express = require('express');
const router = express.Router();
const { validateMiddleware } = require('../utils/validate');
const { RepairPackageSchema } = require('../../schemas/yup/repairPackage');

const {
  getAllRepairPackages,
  getRepairPackageById,
  getRepairPackagesByCategory,
  createRepairPackage,
  updateRepairPackage,
  deleteRepairPackage,
  cloneRepairPackage
} = require('../controllers/repairPackageController');

// GET /api/repair-packages - Get all repair packages (with optional filters)
router.get('/', getAllRepairPackages);

// GET /api/repair-packages/category/:category - Get repair packages by category
router.get('/category/:category', getRepairPackagesByCategory);

// GET /api/repair-packages/:id - Get repair package by ID
router.get('/:id', getRepairPackageById);

// POST /api/repair-packages - Create a new repair package
router.post('/', validateMiddleware(RepairPackageSchema), createRepairPackage);

// POST /api/repair-packages/:id/clone - Clone an existing repair package
router.post('/:id/clone', cloneRepairPackage);

// PUT /api/repair-packages/:id - Update repair package
router.put('/:id', validateMiddleware(RepairPackageSchema), updateRepairPackage);

// DELETE /api/repair-packages/:id - Delete repair package
router.delete('/:id', deleteRepairPackage);

module.exports = router;