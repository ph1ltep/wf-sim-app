// backend/controllers/oemContractController.js
const OEMContract = require('../models/OEMContract');
const Simulation = require('../models/Simulation');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { generateResponsibilityMatrix } = require('../services/oemResponsibilityMatrix');
const { runSimulation } = require('../services/monte-carlo');

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
    
    // Update all scenarios that use this contract
    await updateScenariosWithContract(req.params.id);
    
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
    
    // Update all scenarios that use this contract
    await updateScenariosWithContract(req.params.id, true);
    
    res.json(formatSuccess(null, 'OEM contract deleted successfully'));
  } catch (error) {
    console.error('Error deleting OEM contract:', error);
    res.status(500).json(formatError('Failed to delete OEM contract'));
  }
};

/**
 * Helper function to update all scenarios that use a specific OEM contract
 * @param {string} contractId - The ID of the contract that was modified or deleted
 * @param {boolean} isDeleted - Whether the contract was deleted
 */
const updateScenariosWithContract = async (contractId, isDeleted = false) => {
  try {
    // Find all scenarios that use this contract
    const scenarios = await Simulation.find({
      'parameters.cost.oemContractId': contractId
    });
    
    if (scenarios.length === 0) {
      console.log(`No scenarios found using OEM contract ${contractId}`);
      return;
    }
    
    console.log(`Found ${scenarios.length} scenarios using OEM contract ${contractId}`);
    
    // Update each scenario
    for (const scenario of scenarios) {
      // If contract was deleted, remove the reference
      if (isDeleted) {
        scenario.parameters.cost.oemContractId = null;
        scenario.parameters.cost.fixedOMFee = scenario.parameters.cost.annualBaseOM || 0;
        scenario.oemResponsibilityMatrix = null;
      } else {
        // Fetch the updated contract with scope
        const contract = await OEMContract.findById(contractId).populate('oemScope');
        
        if (contract) {
          // Generate new responsibility matrix
          const matrix = generateResponsibilityMatrix(
            scenario.parameters.general.projectLife || 20,
            scenario.parameters.general.numWTGs || 20,
            [contract]
          );
          
          // Update scenario with new matrix
          scenario.oemResponsibilityMatrix = matrix;
          
          // Update fixed fee
          if (contract.isPerTurbine) {
            scenario.parameters.cost.fixedOMFee = contract.fixedFee * (scenario.parameters.general.numWTGs || 20);
          } else {
            scenario.parameters.cost.fixedOMFee = contract.fixedFee;
          }
          
          // Update OEM term
          scenario.parameters.cost.oemTerm = contract.endYear;
        }
      }
      
      // Re-run simulation with updated parameters
      const simulationResults = runSimulation(scenario.parameters);
      
      // Update scenario results
      scenario.results = simulationResults.results;
      
      // If matrix exists, add to results
      if (scenario.oemResponsibilityMatrix) {
        scenario.results.oemResponsibilityMatrix = scenario.oemResponsibilityMatrix;
      }
      
      // Save the scenario
      await scenario.save();
      console.log(`Updated scenario ${scenario._id}`);
    }
    
    console.log(`Successfully updated all scenarios using OEM contract ${contractId}`);
  } catch (error) {
    console.error('Error updating scenarios:', error);
  }
};

module.exports = {
  getAllOEMContracts,
  getOEMContractById,
  createOEMContract,
  updateOEMContract,
  deleteOEMContract
};