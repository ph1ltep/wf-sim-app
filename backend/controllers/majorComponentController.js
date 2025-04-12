const { MajorComponent } = require('../../schemas/mongoose/majorComponent');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { SuccessResponseSchema, CrudResponseSchema, ErrorResponseSchema } = require('../../schemas/yup/response');

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

    const response = SuccessResponseSchema.cast({
      success: true,
      data: components,
      message: 'Components retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error fetching major components:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to fetch components',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
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
    console.error('Error fetching components internally:', error);
    throw error; // Let caller handle
  }
};

// Get component by ID
const getComponentById = async (req, res) => {
  try {
    const component = await MajorComponent.findById(req.params.id);
    if (!component) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Component not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = SuccessResponseSchema.cast({
      success: true,
      data: component,
      message: 'Component retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error fetching component:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to fetch component',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
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
      const errorResponse = ErrorResponseSchema.cast({
        error: 'A component with this name already exists',
        statusCode: 400,
        errors: ['Duplicate name'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const newComponent = new MajorComponent(validatedData);
    await newComponent.save();

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: newComponent._id, createdAt: newComponent.createdAt, updatedAt: newComponent.updatedAt },
      message: 'Component created successfully',
      timestamp: new Date(),
    });

    res.status(201).json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error creating component:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to create component',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
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
      const errorResponse = ErrorResponseSchema.cast({
        error: 'A component with this name already exists',
        statusCode: 400,
        errors: ['Duplicate name'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const updatedComponent = await MajorComponent.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedComponent) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Component not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: updatedComponent._id, createdAt: updatedComponent.createdAt, updatedAt: updatedComponent.updatedAt },
      message: 'Component updated successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error updating component:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to update component',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

// Delete component
const deleteComponent = async (req, res) => {
  try {
    const component = await MajorComponent.findById(req.params.id);
    if (!component) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Component not found',
        statusCode: 404,
        errors: [],
      });
      return res.status(404).json(formatError(errorResponse.error, errorResponse));
    }

    if (component.isDefault) {
      const errorResponse = ErrorResponseSchema.cast({
        error: 'Cannot delete a default component',
        statusCode: 400,
        errors: ['Default component protected'],
      });
      return res.status(400).json(formatError(errorResponse.error, errorResponse));
    }

    const deletedComponent = await MajorComponent.findByIdAndDelete(req.params.id);

    const response = CrudResponseSchema.cast({
      success: true,
      data: { _id: deletedComponent._id, createdAt: deletedComponent.createdAt, updatedAt: deletedComponent.updatedAt },
      message: 'Component deleted successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'crud'));
  } catch (error) {
    console.error('Error deleting component:', error);
    const errorResponse = ErrorResponseSchema.cast({
      error: 'Failed to delete component',
      statusCode: 500,
      errors: [error.message],
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
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