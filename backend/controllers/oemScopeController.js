const OEMScope = require('../../schemas/mongoose/oemScope');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { OEMScopeSchema } = require('../../schemas/yup/oemScope');

// Get all OEM scopes
const getAllOEMScopes = async (req, res) => {
  try {
    const oemScopes = await OEMScope.find().sort({ name: 1 });
    res.json(formatSuccess(oemScopes, 'OEM scopes retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch OEM scopes', 500, [error.message]));
  }
};

// Get OEM scope by ID
const getOEMScopeById = async (req, res) => {
  try {
    const oemScope = await OEMScope.findById(req.params.id);
    if (!oemScope) {
      return res.status(404).json(formatError('OEM scope not found', 404, []));
    }
    res.json(formatSuccess(oemScope, 'OEM scope retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch OEM scope', 500, [error.message]));
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
      return res.status(400).json(formatError('An OEM scope with this name already exists', 400, ['Duplicate name']));
    }

    const newOEMScope = new OEMScope(validatedData);
    await newOEMScope.save();

    const data = { _id: newOEMScope._id, createdAt: newOEMScope.createdAt, updatedAt: newOEMScope.updatedAt };
    res.status(201).json(formatSuccess(data, 'OEM scope created successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to create OEM scope', 500, [error.message]));
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

    res.json(formatSuccess({ name: generatedName }, 'Name generated successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to generate name', 500, [error.message]));
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
      return res.status(400).json(formatError('An OEM scope with this name already exists', 400, ['Duplicate name']));
    }

    const updatedOEMScope = await OEMScope.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedOEMScope) {
      return res.status(404).json(formatError('OEM scope not found', 404, []));
    }

    const data = { _id: updatedOEMScope._id, createdAt: updatedOEMScope.createdAt, updatedAt: updatedOEMScope.updatedAt };
    res.json(formatSuccess(data, 'OEM scope updated successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to update OEM scope', 500, [error.message]));
  }
};

// Delete OEM scope
const deleteOEMScope = async (req, res) => {
  try {
    const scope = await OEMScope.findById(req.params.id);
    if (!scope) {
      return res.status(404).json(formatError('OEM scope not found', 404, []));
    }

    if (scope.isDefault) {
      return res.status(400).json(formatError('Cannot delete a default OEM scope', 400, ['Default scope protected']));
    }

    const deletedOEMScope = await OEMScope.findByIdAndDelete(req.params.id);

    const data = { _id: deletedOEMScope._id, createdAt: deletedOEMScope.createdAt, updatedAt: deletedOEMScope.updatedAt };
    res.json(formatSuccess(data, 'OEM scope deleted successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to delete OEM scope', 500, [error.message]));
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