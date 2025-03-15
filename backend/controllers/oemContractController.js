// backend/controllers/oemContractController.js
const OEMContract = require('../models/OEMContract');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Get all OEM contracts
const getAllOEMContracts = async (req, res) => {
  try {
    // Populate the OEM scope reference
    const contracts = await OEMContract.find().populate('oemScope').sort({ startYear: 1, endYear: 1 });
    res.json(formatSuccess(contracts));
  } catch (error) {
    console.error('Error fetching OEM contracts:', error);
    res.status(500).json(formatError('Failed to fetch OEM contracts'));
  }
};

// Get OEM contract by ID
const getOEMContractById = async (req, res) => {
  try {
    // Populate the OEM scope reference
    const contract = await OEMContract.findById(req.params.id).populate('oemScope');
    
    if (!contract) {
      return res.status(404).json(formatError('OEM contract not found'));
    }
    
    res.json(formatSuccess(contract));
  } catch (error) {
    console.error('Error fetching OEM contract:', error);
    res.status(500).json(formatError('Failed to fetch OEM contract'));
  }
};

// Create a new OEM contract
const createOEMContract = async (req, res) => {
  try {
    // Validate input data
    if (!req.body.oemScope) {
      return res.status(400).json(formatError('OEM scope is required'));
    }
    
    // Create the new contract
    const newContract = new OEMContract(req.body);
    await newContract.save();
    
    // Populate the OEM scope for response
    await newContract.populate('oemScope');
    
    res.status(201).json(formatSuccess(newContract, 'OEM contract created successfully'));
  } catch (error) {
    console.error('Error creating OEM contract:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }
    
    res.status(500).json(formatError('Failed to create OEM contract'));
  }
};

// Update OEM contract
const updateOEMContract = async (req, res) => {
  try {
    // Check if the contract exists
    const existingContract = await OEMContract.findById(req.params.id);
    
    if (!existingContract) {
      return res.status(404).json(formatError('OEM contract not found'));
    }
    
    // Update the contract
    const updatedContract = await OEMContract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('oemScope');
    
    res.json(formatSuccess(updatedContract, 'OEM contract updated successfully'));
  } catch (error) {
    console.error('Error updating OEM contract:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Validation error: ' + error.message));
    }
    
    res.status(500).json(formatError('Failed to update OEM contract'));
  }
};

// Delete OEM contract
const deleteOEMContract = async (req, res) => {
  try {
    // Check if the contract exists
    const existingContract = await OEMContract.findById(req.params.id);
    
    if (!existingContract) {
      return res.status(404).json(formatError('OEM contract not found'));
    }
    
    // Delete the contract
    await OEMContract.findByIdAndDelete(req.params.id);
    
    res.json(formatSuccess(null, 'OEM contract deleted successfully'));
  } catch (error) {
    console.error('Error deleting OEM contract:', error);
    res.status(500).json(formatError('Failed to delete OEM contract'));
  }
};

module.exports = {
  getAllOEMContracts,
  getOEMContractById,
  createOEMContract,
  updateOEMContract,
  deleteOEMContract
};