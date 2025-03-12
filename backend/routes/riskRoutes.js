// backend/routes/riskRoutes.js
const express = require('express');
const router = express.Router();
const { runRiskModule } = require('../controllers/simulationController');

// POST /api/risk - Run risk mitigation module simulation
router.post('/', runRiskModule);

module.exports = router;