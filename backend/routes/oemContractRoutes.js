// backend/routes/oemContractRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllOEMContracts,
  getOEMContractById,
  createOEMContract,
  updateOEMContract,
  deleteOEMContract
} = require('../controllers/oemContractController');

// GET /api/oemcontracts - Get all OEM contracts
router.get('/', getAllOEMContracts);

// GET /api/oemcontracts/:id - Get OEM contract by ID
router.get('/:id', getOEMContractById);

// POST /api/oemcontracts - Create a new OEM contract
router.post('/', createOEMContract);

// PUT /api/oemcontracts/:id - Update OEM contract
router.put('/:id', updateOEMContract);

// DELETE /api/oemcontracts/:id - Delete OEM contract
router.delete('/:id', deleteOEMContract);

module.exports = router;