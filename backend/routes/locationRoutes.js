// backend/routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController');

// GET /api/locations - Get all locations
router.get('/', getAllLocations);

// GET /api/locations/:id - Get location by ID
router.get('/:id', getLocationById);

// POST /api/locations - Create a new location
router.post('/', createLocation);

// PUT /api/locations/:id - Update location
router.put('/:id', updateLocation);

// DELETE /api/locations/:id - Delete location
router.delete('/:id', deleteLocation);

module.exports = router;