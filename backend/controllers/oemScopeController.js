const OEMScope = require('../../schemas/mongoose/oemScope');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { OEMScopeSchema } = require('../../schemas/yup/oemScope');
const { SuccessResponseSchema, CrudResponseSchema, ErrorResponseSchema } = require('../../schemas/yup/response');

// Get all OEM scopes
const getAllOEMScopes = async (req, res) => {
  try {
    const oemScopes = await OEMScope.find().sort({ name: 1 });

    const response = SuccessResponseSchema.cast({
      success: true,
      data: oemScopes,
      message: 'OEM scopes retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error fetching OEM scopes:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to fetch OEM scopes',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Get OEM scope by ID
const getOEMScopeById = async (req, res) => {
  try {
    const oemScope = await OEMScope.findById(req.params.id);
    if (!oemScope) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'OEM scope not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = SuccessResponseSchema.cast({
      success: true,
      data: oemScope,
      message: 'OEM scope retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error fetching OEM scope:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to fetch OEM scope',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Create a new OEM scope
const createOEMScope = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicate name
    const existingScope = await OEMScope.findOne({ name: validatedData.name });
    if (existingScope) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'An OEM scope with this name already exists',
        statusCode: 400,
        errors: ['Duplicate name'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const newOEMScope = new OEMScope(validatedData);
    await newOEMScope.save();

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: newOEMScope._id, createdAt: newOEMScope.createdAt, updatedAt: newOEMScope.updatedAt },
      message: 'OEM scope created successfully',
      timestamp: new Date(),
    });

    res.status(201).json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error creating OEM scope:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to create OEM scope',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Generate name for an OEM scope based on selections
const generateName = async (req, res) => {
  try {
    // Validate request body
    const validatedData = await OEMScopeSchema.validate(req.body, { stripUnknown: true });

    // Create a temporary document to use the generateName method
    const tempScope = new OEMScope(validatedData);
    const generatedName = tempScope.generateName();

    const response = SuccessResponseSchema.cast({
      success: true,
      data: { name: generatedName },
      message: 'Name generated successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error generating name:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to generate name',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Update OEM scope
const updateOEMScope = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicate name, excluding current scope
    const existingScope = await OEMScope.findOne({
      name: validatedData.name,
      _id: { $ne: req.params.id },
    });
    if (existingScope) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'An OEM scope with this name already exists',
        statusCode: 400,
        errors: ['Duplicate name'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const updatedOEMScope = await OEMScope.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedOEMScope) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'OEM scope not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: updatedOEMScope._id, createdAt: updatedOEMScope.createdAt, updatedAt: updatedOEMScope.updatedAt },
      message: 'OEM scope updated successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error updating OEM scope:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to update OEM scope',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Delete OEM scope
const deleteOEMScope = async (req, res) => {
  try {
    const scope = await OEMScope.findById(req.params.id);
    if (!scope) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'OEM scope not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    if (scope.isDefault) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Cannot delete a default OEM scope',
        statusCode: 400,
        errors: ['Default scope protected'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const deletedOEMScope = await OEMScope.findByIdAndDelete(req.params.id);

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: deletedOEMScope._id, createdAt: deletedOEMScope.createdAt, updatedAt: deletedOEMScope.updatedAt },
      message: 'OEM scope deleted successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error deleting OEM scope:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to delete OEM scope',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

module.exports = {
  getAllOEMScopes,
  getOEMScopeById,
  createOEMScope,
  generateName,
  updateOEMScope,
  deleteOEMScope,
};