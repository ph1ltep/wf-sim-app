// backend/controllers/oemResponsibilityController.js
const OEMContract = require('../models/OEMContract');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { generateResponsibilityMatrix } = require('../services/oemResponsibilityMatrix');

/**
 * Generate the OEM responsibility matrix for a project
 */
const getResponsibilityMatrix = async (req, res) => {
  try {
    // Get parameters from query or use defaults
    const projectLife = parseInt(req.query.projectLife) || 20;
    const numWTGs = parseInt(req.query.numWTGs) || 20;
    
    // Fetch all OEM contracts with populated scope
    const oemContracts = await OEMContract.find().populate('oemScope').sort({ startYear: 1, endYear: 1 });
    
    // Generate the responsibility matrix
    const matrix = generateResponsibilityMatrix(projectLife, numWTGs, oemContracts);
    
    res.json(formatSuccess(matrix));
  } catch (error) {
    console.error('Error generating OEM responsibility matrix:', error);
    res.status(500).json(formatError('Failed to generate OEM responsibility matrix'));
  }
};

/**
 * Generate the OEM responsibility matrix for a specific set of contracts
 */
const generateMatrixForContracts = async (req, res) => {
  try {
    // Get parameters from request body
    const { projectLife, numWTGs, contractIds } = req.body;
    
    if (!projectLife || !numWTGs || !contractIds || !Array.isArray(contractIds)) {
      return res.status(400).json(formatError('Missing required parameters: projectLife, numWTGs, contractIds'));
    }
    
    // Fetch specified OEM contracts
    const oemContracts = await OEMContract.find({
      _id: { $in: contractIds }
    }).populate('oemScope').sort({ startYear: 1, endYear: 1 });
    
    // Generate the responsibility matrix
    const matrix = generateResponsibilityMatrix(projectLife, numWTGs, oemContracts);
    
    res.json(formatSuccess(matrix));
  } catch (error) {
    console.error('Error generating OEM responsibility matrix:', error);
    res.status(500).json(formatError('Failed to generate OEM responsibility matrix'));
  }
};

module.exports = {
  getResponsibilityMatrix,
  generateMatrixForContracts
};