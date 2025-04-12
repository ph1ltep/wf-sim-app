const LocationDefaults = require('../../schemas/mongoose/locationDefaults');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await LocationDefaults.find().sort({ country: 1 });
    res.json(formatSuccess(locations, 'Locations retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch locations', 500, [error.message]));
  }
};

// Get location by ID
const getLocationById = async (req, res) => {
  try {
    const location = await LocationDefaults.findById(req.params.id);
    if (!location) {
      return res.status(404).json(formatError('Location not found', 404, []));
    }
    res.json(formatSuccess(location, 'Location retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch location', 500, [error.message]));
  }
};

// Create a new location
const createLocation = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicates
    const existingLocation = await LocationDefaults.findOne({
      $or: [{ country: validatedData.country }, { countryCode: validatedData.countryCode }],
    });
    if (existingLocation) {
      return res.status(400).json(formatError('A location with this country or country code already exists', 400, ['Duplicate country or country code']));
    }

    const newLocation = new LocationDefaults(validatedData);
    await newLocation.save();

    const data = { _id: newLocation._id, createdAt: newLocation.createdAt, updatedAt: newLocation.updatedAt };
    res.status(201).json(formatSuccess(data, 'Location created successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to create location', 500, [error.message]));
  }
};

// Update location
const updateLocation = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicates, excluding current location
    const existingLocation = await LocationDefaults.findOne({
      $or: [
        validatedData.country ? { country: validatedData.country } : null,
        validatedData.countryCode ? { countryCode: validatedData.countryCode } : null,
      ].filter(Boolean),
      _id: { $ne: req.params.id },
    });
    if (existingLocation) {
      return res.status(400).json(formatError('A location with this country or country code already exists', 400, ['Duplicate country or country code']));
    }

    const updatedLocation = await LocationDefaults.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedLocation) {
      return res.status(404).json(formatError('Location not found', 404, []));
    }

    const data = { _id: updatedLocation._id, createdAt: updatedLocation.createdAt, updatedAt: updatedLocation.updatedAt };
    res.json(formatSuccess(data, 'Location updated successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to update location', 500, [error.message]));
  }
};

// Delete location
const deleteLocation = async (req, res) => {
  try {
    const deletedLocation = await LocationDefaults.findByIdAndDelete(req.params.id);
    if (!deletedLocation) {
      return res.status(404).json(formatError('Location not found', 404, []));
    }

    const data = { _id: deletedLocation._id, createdAt: deletedLocation.createdAt, updatedAt: deletedLocation.updatedAt };
    res.json(formatSuccess(data, 'Location deleted successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to delete location', 500, [error.message]));
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};