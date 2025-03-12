// backend/routes/financingRoutes.js
const express = require('express');
const router = express.Router();
const { runFinancingModule } = require('../controllers/simulationController');

// POST /api/financing - Run financing module simulation
router.post('/', runFinancingModule);

module.exports = router;