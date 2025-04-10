// backend/controllers/locationController.js
const LocationDefaults = require('../../schemas/mongoose/locationDefaults');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await LocationDefaults.find().sort({ country: 1 });
    res.json(formatSuccess(locations));
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json(formatError('Failed to fetch locations'));
  }
};

// Get location by ID
const getLocationById = async (req, res) => {
  try {
    const location = await LocationDefaults.findById(req.params.id);

    if (!location) {
      return res.status(404).json(formatError('Location not found'));
    }

    res.json(formatSuccess(location));
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json(formatError('Failed to fetch location'));
  }
};

// Create a new location
const createLocation = async (req, res) => {
  try {
    // Check if location with same country or country code already exists
    const existingLocation = await LocationDefaults.findOne({
      $or: [
        { country: req.body.country },
        { countryCode: req.body.countryCode }
      ]
    });

    if (existingLocation) {
      return res.status(400).json(formatError('A location with this country or country code already exists'));
    }

    const newLocation = new LocationDefaults(req.body);
    await newLocation.save();

    res.status(201).json(formatSuccess(newLocation, 'Location created successfully'));
  } catch (error) {
    console.error('Error creating location:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }

    res.status(500).json(formatError('Failed to create location'));
  }
};

// Update location
const updateLocation = async (req, res) => {
  try {
    // Check if update would create a duplicate
    if (req.body.country || req.body.countryCode) {
      const existingLocation = await LocationDefaults.findOne({
        $or: [
          req.body.country ? { country: req.body.country } : null,
          req.body.countryCode ? { countryCode: req.body.countryCode } : null
        ].filter(Boolean),
        _id: { $ne: req.params.id }
      });

      if (existingLocation) {
        return res.status(400).json(formatError('A location with this country or country code already exists'));
      }
    }

    const updatedLocation = await LocationDefaults.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedLocation) {
      return res.status(404).json(formatError('Location not found'));
    }

    res.json(formatSuccess(updatedLocation, 'Location updated successfully'));
  } catch (error) {
    console.error('Error updating location:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }

    res.status(500).json(formatError('Failed to update location'));
  }
};

// Delete location
const deleteLocation = async (req, res) => {
  try {
    const deletedLocation = await LocationDefaults.findByIdAndDelete(req.params.id);

    if (!deletedLocation) {
      return res.status(404).json(formatError('Location not found'));
    }

    res.json(formatSuccess(null, 'Location deleted successfully'));
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json(formatError('Failed to delete location'));
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};