// backend/routes/revenueRoutes.js
const express = require('express');
const router = express.Router();
const { runRevenueModule } = require('../controllers/simulationController');

// POST /api/revenue - Run revenue module simulation
router.post('/', runRevenueModule);

module.exports = router;