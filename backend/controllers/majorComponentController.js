const { MajorComponent } = require('../../schemas/mongoose/majorComponent');
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
    res.json(formatSuccess(components, 'Components retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch components', 500, [error.message]));
  }
};

// Function to get all components (for internal use)
const getComponents = async (platformType) => {
  try {
    const query = {};
    if (platformType === 'geared') {
      query['appliesTo.geared'] = true;
    } else if (platformType === 'direct-drive') {
      query['appliesTo.directDrive'] = true;
    }
    return await MajorComponent.find(query).sort({ name: 1 });
  } catch (error) {
    throw error; // Let caller handle
  }
};

// Get component by ID
const getComponentById = async (req, res) => {
  try {
    const component = await MajorComponent.findById(req.params.id);
    if (!component) {
      return res.status(404).json(formatError('Component not found', 404, []));
    }
    res.json(formatSuccess(component, 'Component retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch component', 500, [error.message]));
  }
};

// Create a new component
const createComponent = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicate name
    const existingComponent = await MajorComponent.findOne({ name: validatedData.name });
    if (existingComponent) {
      return res.status(400).json(formatError('A component with this name already exists', 400, ['Duplicate name']));
    }

    const newComponent = new MajorComponent(validatedData);
    await newComponent.save();

    const data = { _id: newComponent._id, createdAt: newComponent.createdAt, updatedAt: newComponent.updatedAt };
    res.status(201).json(formatSuccess(data, 'Component created successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to create component', 500, [error.message]));
  }
};

// Update component
const updateComponent = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicate name, excluding current component
    const existingComponent = await MajorComponent.findOne({
      name: validatedData.name,
      _id: { $ne: req.params.id },
    });
    if (existingComponent) {
      return res.status(400).json(formatError('A component with this name already exists', 400, ['Duplicate name']));
    }

    const updatedComponent = await MajorComponent.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedComponent) {
      return res.status(404).json(formatError('Component not found', 404, []));
    }

    const data = { _id: updatedComponent._id, createdAt: updatedComponent.createdAt, updatedAt: updatedComponent.updatedAt };
    res.json(formatSuccess(data, 'Component updated successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to update component', 500, [error.message]));
  }
};

// Delete component
const deleteComponent = async (req, res) => {
  try {
    const component = await MajorComponent.findById(req.params.id);
    if (!component) {
      return res.status(404).json(formatError('Component not found', 404, []));
    }

    if (component.isDefault) {
      return res.status(400).json(formatError('Cannot delete a default component', 400, ['Default component protected']));
    }

    const deletedComponent = await MajorComponent.findByIdAndDelete(req.params.id);

    const data = { _id: deletedComponent._id, createdAt: deletedComponent.createdAt, updatedAt: deletedComponent.updatedAt };
    res.json(formatSuccess(data, 'Component deleted successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to delete component', 500, [error.message]));
  }
};

module.exports = {
  getAllComponents,
  getComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
};