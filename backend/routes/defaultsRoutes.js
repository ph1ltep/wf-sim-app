// backend/routes/defaultsRoutes.js
const express = require('express');
const router = express.Router();
const { getDefaults } = require('../controllers/defaultsController');

// GET /api/defaults - Get default settings
router.get('/', getDefaults);

module.exports = router;