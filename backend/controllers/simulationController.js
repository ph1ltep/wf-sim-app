// backend/controllers/distributionController.js
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const monteCarloV2 = require('../services/monte-carlo-v2');
//const validate = require('./utils/validate');
const { ScenarioSchema } = require('../../schemas/yup/scenario');

/**
 * Run a simulation of multiple distributions with the new Monte Carlo engine
 * @param {Object} req - Express request object with SimRequestSchema in body
 * @param {Object} res - Express response object
 */
const simulateDistributions = async (req, res) => {
    try {
        const {
            distributions,
            simulationSettings
        } = req.body;

        // Validate request structure



        if (!distributions || !Array.isArray(distributions) || distributions.length === 0) {
            return res.status(400).json(formatError('At least one valid distribution is required'));
        }

        if (!simulationSettings || !simulationSettings.iterations) {
            return res.status(400).json(formatError('Valid simulation settings with iterations are required'));
        }

        // Create Monte Carlo engine
        const engine = monteCarloV2.createEngine({
            iterations: simulationSettings.iterations,
            seed: simulationSettings.seed || Math.floor(Math.random() * 1000000),
            years: simulationSettings.years || 20,
            percentiles: simulationSettings.percentiles || [
                { value: 50, description: 'primary' },
                { value: 75, description: 'upper_bound' },
                { value: 25, description: 'lower_bound' },
                { value: 10, description: 'extreme_lower' },
                { value: 90, description: 'extreme_upper' }
            ]
        });

        // Add distributions to the engine
        distributions.forEach((distribution, index) => {
            const id = distribution.id || `distribution_${index + 1}`;
            engine.addDistribution(id, distribution);
        });

        // Run the simulation
        const simulationResults = await engine.run();

        // Format the results to match SimResponseSchema
        const formattedResults = {
            success: true,
            simulationInfo: []
        };

        // Create an info entry for each distribution
        for (const [id, results] of Object.entries(simulationResults.simulationInfo.results)) {
            const distribution = simulationResults.simulationInfo.distributions[id] || distributions.find(d => d.id === id) || distributions[0];
            const errors = simulationResults.errors[id] || [];

            formattedResults.simulationInfo.push({
                distribution: distribution,
                iterations: simulationSettings.iterations,
                seed: simulationSettings.seed || engine.options.seed,
                years: simulationSettings.years || 20,
                timeElapsed: simulationResults.simulationInfo.timeElapsed,
                results: Array.isArray(results) ? results : [results],
                errors: Array.isArray(errors) ? errors : errors.length > 0 ? [errors.join(', ')] : []
            });
        }

        // If no results were processed, add at least one entry with errors
        if (formattedResults.simulationInfo.length === 0) {
            formattedResults.simulationInfo.push({
                distribution: distributions[0],
                iterations: simulationSettings.iterations,
                seed: simulationSettings.seed || engine.options.seed,
                years: simulationSettings.years || 20,
                timeElapsed: 0,
                results: [],
                errors: ['No distributions were successfully processed']
            });
            formattedResults.success = false;
        };

        return res.json(formatSuccess(formattedResults, '', 'simulation'));
    } catch (error) {
        console.error('Error in Monte Carlo V2 simulation:', error);
        return res.status(500).json(formatError(`Simulation failed: ${error.message}`));
    }
};

/**
 * Run a simulation for a single distribution
 * @param {Object} req - Express request object with SimRequestSchema in body (single distribution)
 * @param {Object} res - Express response object
 */
const simulateDistribution = async (req, res) => {
    try {
        const {
            distribution,
            simulationSettings
        } = req.body;

        if (!distribution || !distribution.type || !distribution.parameters) {
            return res.status(400).json(formatError('Valid distribution object with type and parameters is required'));
        }

        if (!simulationSettings || !simulationSettings.iterations) {
            return res.status(400).json(formatError('Valid simulation settings with iterations are required'));
        }

        // Run the simulation
        const result = await monteCarloV2.simulateDistribution(distribution, simulationSettings);

        // Format the results to match SimResponseSchema
        const formattedResult = {
            success: result.success,
            simulationInfo: [{
                distribution: distribution,
                iterations: simulationSettings.iterations,
                seed: simulationSettings.seed || result.simulationInfo.seed,
                years: simulationSettings.years || 20,
                timeElapsed: result.simulationInfo.timeElapsed || 0,
                results: Array.isArray(result.results) ? result.results :
                    (result.results ? [result.results.main || result.results] : []),
                errors: result.error ? [result.error] :
                    (Array.isArray(result.errors) ? result.errors : [])
            }]
        };

        return res.json(formatSuccess(formattedResult, '', 'simulation'));
    } catch (error) {
        console.error('Error in distribution simulation:', error);
        return res.status(500).json(formatError(`Distribution simulation failed: ${error.message}`));
    }
};

/**
 * Get metadata for all registered distributions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDistributionsInfo = (req, res) => {
    try {
        const distributionsInfo = monteCarloV2.getDistributionsInfo();
        return res.json(formatSuccess(distributionsInfo));
    } catch (error) {
        console.error('Error getting distributions info:', error);
        return res.status(500).json(formatError(`Failed to get distributions info: ${error.message}`));
    }
};

/**
 * Validate distribution parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateDistribution = (req, res) => {
    try {
        const { type, parameters } = req.body;

        if (!type) {
            return res.status(400).json(formatError('Distribution type is required'));
        }

        if (!parameters) {
            return res.status(400).json(formatError('Distribution parameters are required'));
        }

        const validation = monteCarloV2.validateParameters(type, parameters);

        return res.json(formatSuccess({
            isValid: validation.isValid,
            errors: validation.errors || []
        }, '', 'simulation'));
    } catch (error) {
        console.error('Error validating distribution:', error);
        return res.status(500).json(formatError(`Validation failed: ${error.message}`));
    }
};

/**
 * Fit a distribution to data points
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const fitDistribution = (req, res) => {
    try {
        const { type, dataPoints } = req.body;

        if (!type) {
            return res.status(400).json(formatError('Distribution type is required'));
        }

        if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
            return res.status(400).json(formatError('Valid data points array is required'));
        }

        const fittedParameters = monteCarloV2.fitDistribution(type, dataPoints);

        return res.json(formatSuccess({
            type,
            parameters: fittedParameters
        }));
    } catch (error) {
        console.error('Error fitting distribution:', error);
        return res.status(500).json(formatError(`Fitting failed: ${error.message}`));
    }
};

module.exports = {
    simulateDistributions,
    simulateDistribution,
    getDistributionsInfo,
    validateDistribution,
    fitDistribution
};