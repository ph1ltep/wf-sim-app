// backend/routes/costRoutes.js
const express = require('express');
const router = express.Router();
const { runCostModule } = require('../controllers/simulationController');

// POST /api/cost - Run cost module simulation
router.post('/', runCostModule);

module.exports = router;