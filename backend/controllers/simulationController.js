const { formatSuccess, formatError } = require('../utils/responseFormatter');
const monteCarloV2 = require('../services/monte-carlo-v2');
const { DistributionTypeSchema, ValidationResponseSchema, DataPointSchema } = require('../../schemas/yup/distribution');

/**
 * Run a simulation of one or more distributions with the new Monte Carlo engine
 * @param {Object} req - Express request object with SimRequestSchema in body
 * @param {Object} res - Express response object
 */
const simulateDistributions = async (req, res) => {
    try {
        // Request is already validated by SimRequestSchema via middleware
        const simRequest = req.body;

        // Create engine with the validated simRequest
        const engine = monteCarloV2.createEngine(simRequest);

        // Run the simulation
        const simulationResults = await engine.run();

        // Format response for API
        const responseData = {
            success: simulationResults.success,
            simulationInfo: simulationResults.simulationInfo,
            timeElapsed: simulationResults.simulationInfo[0]?.timeElapsed || 0
        };

        return res.json(formatSuccess(responseData, 'Simulation completed successfully', 'simulation'));
    } catch (error) {
        return res.status(500).json(formatError('Simulation failed', 500, [error.message]));
    }
};

/**
 * Get metadata for all registered distributions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDistributionsInfo = (req, res) => {
    try {
        const distributionsInfo = monteCarloV2.getAllDistributionsMetadata();
        return res.json(formatSuccess(distributionsInfo, 'Operation successful', 'default'));
    } catch (error) {
        return res.status(500).json(formatError('Failed to get distributions info', 500, [error.message]));
    }
};

/**
 * Validate distribution parameters
 * @param {Object} req - Express request object with DistributionTypeSchema in body
 * @param {Object} res - Express response object
 */
const validateDistribution = (req, res) => {
    try {
        // Validate input against DistributionTypeSchema
        const distribution = DistributionTypeSchema.validateSync(req.body, { strict: true });

        // Validate parameters using the distribution registry
        const validation = monteCarloV2.validateParameters(distribution.type, distribution.parameters);

        // Ensure validation result matches ValidationResponseSchema
        const validationResult = ValidationResponseSchema.validateSync({
            isValid: validation.isValid,
            errors: validation.errors || [],
            details: null
        }, { stripUnknown: true });

        return res.json(formatSuccess(validationResult, 'Validation successful', 'default'));
    } catch (error) {
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        return res.status(statusCode).json(formatError('Validation failed', statusCode, [error.message]));
    }
};

/**
 * Fit a distribution to data points
 * @param {Object} req - Express request object with FitDistributionSchema in body
 * @param {Object} res - Express response object
 */
const fitDistribution = (req, res) => {
    try {
        // Request is already validated by FitDistributionSchema via middleware
        const { distribution, dataPoints } = req.body;

        // Fit distribution using the distribution registry
        const fittedParameters = monteCarloV2.fitDistribution(distribution.type, dataPoints);

        // Validate output parameters against DistributionParametersSchema
        const validatedParameters = DistributionParametersSchema.validateSync(fittedParameters, { stripUnknown: true });

        return res.json(formatSuccess(validatedParameters, 'Distribution fitted successfully', 'default'));
    } catch (error) {
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        return res.status(statusCode).json(formatError('Fitting failed', statusCode, [error.message]));
    }
};

module.exports = {
    simulateDistributions,
    getDistributionsInfo,
    validateDistribution,
    fitDistribution
};