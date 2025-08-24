const RepairPackage = require('../../schemas/mongoose/repairPackage');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Get all repair packages
const getAllRepairPackages = async (req, res) => {
  try {
    const { category, isActive, isDefault } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDefault !== undefined) filter.isDefault = isDefault === 'true';
    
    const repairPackages = await RepairPackage.find(filter).sort({ category: 1, name: 1 });
    res.json(formatSuccess(repairPackages, 'Repair packages retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch repair packages', 500, [error.message]));
  }
};

// Get repair package by ID
const getRepairPackageById = async (req, res) => {
  try {
    const repairPackage = await RepairPackage.findById(req.params.id);
    if (!repairPackage) {
      return res.status(404).json(formatError('Repair package not found', 404, []));
    }
    res.json(formatSuccess(repairPackage, 'Repair package retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch repair package', 500, [error.message]));
  }
};

// Get repair packages by category
const getRepairPackagesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { isActive } = req.query;
    
    const filter = { category };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const repairPackages = await RepairPackage.find(filter).sort({ name: 1 });
    res.json(formatSuccess(repairPackages, `Repair packages for category ${category} retrieved successfully`, 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch repair packages by category', 500, [error.message]));
  }
};

// Create a new repair package
const createRepairPackage = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicates
    const existingRepairPackage = await RepairPackage.findOne({ name: validatedData.name });
    if (existingRepairPackage) {
      return res.status(400).json(formatError('A repair package with this name already exists', 400, ['Duplicate name']));
    }

    const newRepairPackage = new RepairPackage(validatedData);
    await newRepairPackage.save();

    const data = { _id: newRepairPackage._id, createdAt: newRepairPackage.createdAt, updatedAt: newRepairPackage.updatedAt };
    res.status(201).json(formatSuccess(data, 'Repair package created successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to create repair package', 500, [error.message]));
  }
};

// Update repair package
const updateRepairPackage = async (req, res) => {
  try {
    // Validation handled by middleware
    const validatedData = req.body;

    // Check for duplicates, excluding current package
    if (validatedData.name) {
      const existingRepairPackage = await RepairPackage.findOne({
        name: validatedData.name,
        _id: { $ne: req.params.id },
      });
      if (existingRepairPackage) {
        return res.status(400).json(formatError('A repair package with this name already exists', 400, ['Duplicate name']));
      }
    }

    const updatedRepairPackage = await RepairPackage.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedRepairPackage) {
      return res.status(404).json(formatError('Repair package not found', 404, []));
    }

    const data = { _id: updatedRepairPackage._id, createdAt: updatedRepairPackage.createdAt, updatedAt: updatedRepairPackage.updatedAt };
    res.json(formatSuccess(data, 'Repair package updated successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to update repair package', 500, [error.message]));
  }
};

// Delete repair package
const deleteRepairPackage = async (req, res) => {
  try {
    const deletedRepairPackage = await RepairPackage.findByIdAndDelete(req.params.id);
    if (!deletedRepairPackage) {
      return res.status(404).json(formatError('Repair package not found', 404, []));
    }

    const data = { _id: deletedRepairPackage._id, createdAt: deletedRepairPackage.createdAt, updatedAt: deletedRepairPackage.updatedAt };
    res.json(formatSuccess(data, 'Repair package deleted successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to delete repair package', 500, [error.message]));
  }
};

// Clone an existing repair package (useful for creating similar packages)
const cloneRepairPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json(formatError('New name is required for cloning', 400, ['Missing name']));
    }

    // Check if new name already exists
    const existingRepairPackage = await RepairPackage.findOne({ name });
    if (existingRepairPackage) {
      return res.status(400).json(formatError('A repair package with this name already exists', 400, ['Duplicate name']));
    }

    // Get the original package
    const originalPackage = await RepairPackage.findById(id);
    if (!originalPackage) {
      return res.status(404).json(formatError('Original repair package not found', 404, []));
    }

    // Create clone with new name and non-default status
    const cloneData = originalPackage.toObject();
    delete cloneData._id;
    delete cloneData.__v;
    cloneData.name = name;
    cloneData.isDefault = false;
    cloneData.createdAt = new Date();
    cloneData.updatedAt = new Date();

    const clonedPackage = new RepairPackage(cloneData);
    await clonedPackage.save();

    const data = { _id: clonedPackage._id, createdAt: clonedPackage.createdAt, updatedAt: clonedPackage.updatedAt };
    res.status(201).json(formatSuccess(data, 'Repair package cloned successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to clone repair package', 500, [error.message]));
  }
};

module.exports = {
  getAllRepairPackages,
  getRepairPackageById,
  getRepairPackagesByCategory,
  createRepairPackage,
  updateRepairPackage,
  deleteRepairPackage,
  cloneRepairPackage,
};