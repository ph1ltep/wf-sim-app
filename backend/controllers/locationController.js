const LocationDefaults = require('../../schemas/mongoose/locationDefaults');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { SuccessResponseSchema, CrudResponseSchema, ErrorResponseSchema } = require('../../schemas/yup/response');

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await LocationDefaults.find().sort({ country: 1 });

    const response = SuccessResponseSchema.cast({
      success: true,
      data: locations,
      message: 'Locations retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error fetching locations:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to fetch locations',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Get location by ID
const getLocationById = async (req, res) => {
  try {
    const location = await LocationDefaults.findById(req.params.id);
    if (!location) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Location not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = SuccessResponseSchema.cast({
      success: true,
      data: location,
      message: 'Location retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error fetching location:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to fetch location',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
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
      const errorResponse = ErrorResponseSchema.cast({
        error: 'A location with this country or country code already exists',
        statusCode: 400,
        errors: ['Duplicate country or country code'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const newLocation = new LocationDefaults(validatedData);
    await newLocation.save();

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: newLocation._id, createdAt: newLocation.createdAt, updatedAt: newLocation.updatedAt },
      message: 'Location created successfully',
      timestamp: new Date(),
    });

    res.status(201).json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error creating location:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to create location',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
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
      const errorResponse = ErrorResponseSchema.cast({
        error: 'A location with this country or country code already exists',
        statusCode: 400,
        errors: ['Duplicate country or country code'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const updatedLocation = await LocationDefaults.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedLocation) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Location not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: updatedLocation._id, createdAt: updatedLocation.createdAt, updatedAt: updatedLocation.updatedAt },
      message: 'Location updated successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error updating location:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to update location',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Delete location
const deleteLocation = async (req, res) => {
  try {
    const deletedLocation = await LocationDefaults.findByIdAndDelete(req.params.id);
    if (!deletedLocation) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Location not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: deletedLocation._id, createdAt: deletedLocation.createdAt, updatedAt: deletedLocation.updatedAt },
      message: 'Location deleted successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error deleting location:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to delete location',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};