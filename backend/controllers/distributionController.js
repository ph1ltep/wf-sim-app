// backend/controllers/distributionController.js
const DistributionFactory = require('../services/monte-carlo/distributions');
const seedrandom = require('seedrandom');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

/**
 * Run a simulation of a specific distribution type with given parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const simulateDistribution = (req, res) => {
    try {
        const {
            distribution,
            simulationSettings,
            years = 20,
            name = 'distribution_sim'
        } = req.body;

        if (!distribution || !distribution.type || !distribution.parameters) {
            return res.status(400).json(formatError('Valid distribution object with type and parameters is required'));
        }

        if (!simulationSettings || !simulationSettings.percentiles || !simulationSettings.iterations) {
            return res.status(400).json(formatError('Valid simulation settings with percentiles and iterations are required'));
        }

        const iterations = simulationSettings.iterations;
        const seed = simulationSettings.seed || 42;
        const percentiles = simulationSettings.percentiles.map(p => p.value);
        const originalRandom = Math.random;
        Math.random = seedrandom(seed);

        const timeSeriesMode = distribution.timeSeriesMode || hasTimeSeriesParameters(distribution.parameters);
        const yearlyData = Array(years).fill().map(() => []);

        for (let i = 0; i < iterations; i++) {
            for (let year = 0; year < years; year++) {
                try {
                    const distributionFunction = DistributionFactory.createDistribution(
                        distribution,
                        { year: year + 1 }
                    );
                    const value = distributionFunction();
                    yearlyData[year].push(value);
                } catch (error) {
                    Math.random = originalRandom;
                    return res.status(400).json(formatError(`Failed to create distribution: ${error.message}`));
                }
            }
        }

        const results = [];

        simulationSettings.percentiles.forEach(percentileConfig => {
            const percentileValue = percentileConfig.value;
            const result = {
                name: `${name}_P${percentileValue}`,
                percentile: {
                    value: percentileValue,
                    description: percentileConfig.description || 'custom',
                    label: `P${percentileValue}`
                },
                data: []
            };

            for (let year = 0; year < years; year++) {
                const yearValues = yearlyData[year];
                const percentileResults = DistributionFactory.calculatePercentiles(yearValues, [percentileValue]);
                result.data.push({
                    year: year + 1,
                    value: percentileResults[`P${percentileValue}`]
                });
            }

            results.push(result);
        });

        Math.random = originalRandom;

        return res.json(formatSuccess({
            simulationInfo: {
                distribution,
                iterations,
                seed,
                years,
                timeSeriesMode
            },
            results
        }));
    } catch (error) {
        console.error('Error in distribution simulation:', error);
        return res.status(500).json(formatError(`Distribution simulation failed: ${error.message}`));
    }
};

function hasTimeSeriesParameters(parameters) {
    if (!parameters) return false;

    return Object.values(parameters).some(param =>
        Array.isArray(param) && param.length > 0 && param[0].year !== undefined
    );
}

module.exports = {
    simulateDistribution
};