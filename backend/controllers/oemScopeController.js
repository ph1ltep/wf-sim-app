// backend/controllers/oemScopeController.js
const OEMScope = require('../models/OEMScope');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Get all OEM scopes
const getAllOEMScopes = async (req, res) => {
  try {
    const oemScopes = await OEMScope.find().sort({ name: 1 });
    res.json(formatSuccess(oemScopes));
  } catch (error) {
    console.error('Error fetching OEM scopes:', error);
    res.status(500).json(formatError('Failed to fetch OEM scopes'));
  }
};

// Get OEM scope by ID
const getOEMScopeById = async (req, res) => {
  try {
    const oemScope = await OEMScope.findById(req.params.id);
    
    if (!oemScope) {
      return res.status(404).json(formatError('OEM scope not found'));
    }
    
    res.json(formatSuccess(oemScope));
  } catch (error) {
    console.error('Error fetching OEM scope:', error);
    res.status(500).json(formatError('Failed to fetch OEM scope'));
  }
};

// Create a new OEM scope
const createOEMScope = async (req, res) => {
  try {
    // Check if scope with same name already exists
    if (req.body.name) {
      const existingScope = await OEMScope.findOne({ name: req.body.name });
      
      if (existingScope) {
        return res.status(400).json(formatError('An OEM scope with this name already exists'));
      }
    }
    
    const newOEMScope = new OEMScope(req.body);
    await newOEMScope.save();
    
    res.status(201).json(formatSuccess(newOEMScope, 'OEM scope created successfully'));
  } catch (error) {
    console.error('Error creating OEM scope:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }
    
    res.status(500).json(formatError('Failed to create OEM scope'));
  }
};

// Generate name for an OEM scope based on selections
const generateName = async (req, res) => {
  try {
    // Create a temporary document to use the generateName method
    const tempScope = new OEMScope(req.body);
    const generatedName = tempScope.generateName();
    
    res.json(formatSuccess({ name: generatedName }, 'Name generated successfully'));
  } catch (error) {
    console.error('Error generating name:', error);
    res.status(500).json(formatError('Failed to generate name'));
  }
};

// Update OEM scope
const updateOEMScope = async (req, res) => {
  try {
    // Check if update would create a duplicate name
    if (req.body.name) {
      const existingScope = await OEMScope.findOne({
        name: req.body.name,
        _id: { $ne: req.params.id }
      });
      
      if (existingScope) {
        return res.status(400).json(formatError('An OEM scope with this name already exists'));
      }
    }
    
    const updatedOEMScope = await OEMScope.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedOEMScope) {
      return res.status(404).json(formatError('OEM scope not found'));
    }
    
    res.json(formatSuccess(updatedOEMScope, 'OEM scope updated successfully'));
  } catch (error) {
    console.error('Error updating OEM scope:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }
    
    res.status(500).json(formatError('Failed to update OEM scope'));
  }
};

// Delete OEM scope
const deleteOEMScope = async (req, res) => {
  try {
    // Check if it's a default scope (should not delete default scopes)
    const scope = await OEMScope.findById(req.params.id);
    
    if (!scope) {
      return res.status(404).json(formatError('OEM scope not found'));
    }
    
    if (scope.isDefault) {
      return res.status(400).json(formatError('Cannot delete a default OEM scope'));
    }
    
    const deletedOEMScope = await OEMScope.findByIdAndDelete(req.params.id);
    
    res.json(formatSuccess(null, 'OEM scope deleted successfully'));
  } catch (error) {
    console.error('Error deleting OEM scope:', error);
    res.status(500).json(formatError('Failed to delete OEM scope'));
  }
};

module.exports = {
  getAllOEMScopes,
  getOEMScopeById,
  createOEMScope,
  generateName,
  updateOEMScope,
  deleteOEMScope
};