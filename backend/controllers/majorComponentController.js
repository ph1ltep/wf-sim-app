// backend/controllers/majorComponentController.js
const MajorComponent = require('../models/MajorComponent');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Get all major components
const getAllComponents = async (req, res) => {
  try {
    // Get filter parameters
    const platformType = req.query.platform;
    
    // Build query
    const query = {};
    if (platformType === 'geared') {
      query['appliesTo.geared'] = true;
    } else if (platformType === 'direct-drive') {
      query['appliesTo.directDrive'] = true;
    }
    
    const components = await MajorComponent.find(query).sort({ name: 1 });
    res.json(formatSuccess(components));
  } catch (error) {
    console.error('Error fetching major components:', error);
    res.status(500).json(formatError('Failed to fetch components'));
  }
};

// Function to get all components (for internal use)
const getComponents = async (platformType) => {
  // Build query
  const query = {};
  if (platformType === 'geared') {
    query['appliesTo.geared'] = true;
  } else if (platformType === 'direct-drive') {
    query['appliesTo.directDrive'] = true;
  }
  
  return await MajorComponent.find(query).sort({ name: 1 });
};

// Get component by ID
const getComponentById = async (req, res) => {
  try {
    const component = await MajorComponent.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json(formatError('Component not found'));
    }
    
    res.json(formatSuccess(component));
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json(formatError('Failed to fetch component'));
  }
};

// Create a new component
const createComponent = async (req, res) => {
  try {
    // Check if component with same name already exists
    const existingComponent = await MajorComponent.findOne({
      name: req.body.name
    });
    
    if (existingComponent) {
      return res.status(400).json(formatError('A component with this name already exists'));
    }
    
    const newComponent = new MajorComponent(req.body);
    await newComponent.save();
    
    res.status(201).json(formatSuccess(newComponent, 'Component created successfully'));
  } catch (error) {
    console.error('Error creating component:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }
    
    res.status(500).json(formatError('Failed to create component'));
  }
};

// Update component
const updateComponent = async (req, res) => {
  try {
    // Check if update would create a duplicate
    if (req.body.name) {
      const existingComponent = await MajorComponent.findOne({
        name: req.body.name,
        _id: { $ne: req.params.id }
      });
      
      if (existingComponent) {
        return res.status(400).json(formatError('A component with this name already exists'));
      }
    }
    
    const updatedComponent = await MajorComponent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedComponent) {
      return res.status(404).json(formatError('Component not found'));
    }
    
    res.json(formatSuccess(updatedComponent, 'Component updated successfully'));
  } catch (error) {
    console.error('Error updating component:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }
    
    res.status(500).json(formatError('Failed to update component'));
  }
};

// Delete component
const deleteComponent = async (req, res) => {
  try {
    // Check if it's a default component
    const component = await MajorComponent.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json(formatError('Component not found'));
    }
    
    if (component.isDefault) {
      return res.status(400).json(formatError('Cannot delete a default component'));
    }
    
    const deletedComponent = await MajorComponent.findByIdAndDelete(req.params.id);
    
    res.json(formatSuccess(null, 'Component deleted successfully'));
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json(formatError('Failed to delete component'));
  }
};

module.exports = {
  getAllComponents,
  getComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent
};