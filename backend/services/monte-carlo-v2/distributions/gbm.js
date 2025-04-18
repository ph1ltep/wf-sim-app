// backend/services/monte-carlo-v2/distributions/gbm.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Geometric Brownian Motion (GBM) distribution implementation
 * Used for modeling asset prices, stock prices, and other financial variables
 * that exhibit exponential growth with random volatility
 */
class GBMDistribution extends DistributionGenerator {
    /**
     * Initialize the GBM distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        // For GBM, we need to track the last value for path continuity
        return {
            lastValue: this.getParameterValue('value', 1, 100)
        };
    }

    /**
     * Generate a random value from the GBM distribution
     * GBM equation: S(t+Δt) = S(t) * exp((μ - σ²/2)Δt + σ√Δt * Z)
     * where Z is a standard normal random variable
     * 
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from GBM distribution
     */
    generate(year, random) {
        // Get parameters
        const initialValue = this.getParameterValue('value', year, 100);

        // Get drift and volatility (convert from percentages to decimals)
        const driftPercent = this.getParameterValue('drift', year, 5);
        const volatilityPercent = this.getParameterValue('volatility', year, 20);
        const drift = driftPercent / 100;
        const volatility = volatilityPercent / 100;

        // Get time step (typically 1 for annual simulations)
        const timeStep = this.getParameterValue('timeStep', year, 1);

        // If this is the first year, use the initial value
        if (year === 1) {
            this.state.lastValue = initialValue;
            return initialValue;
        }

        // Generate standard normal random variable using Box-Muller transform
        const u1 = random();
        const u2 = random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Calculate the drift-adjusted component
        const adjustedDrift = drift - (volatility * volatility) / 2;

        // Apply the GBM formula starting from the last value
        const newValue = this.state.lastValue *
            Math.exp(adjustedDrift * timeStep + volatility * Math.sqrt(timeStep) * z);

        // Store the new value for the next iteration
        this.state.lastValue = newValue;

        return newValue;
    }

    /**
     * Update year - reset the path if returning to year 1
     * @param {number} year - Current year
     */
    updateYear(year) {
        // If we're starting a new path from year 1, reset the state
        if (year === 1) {
            this.state.lastValue = this.getParameterValue('value', 1, 100);
        }
    }

    /**
     * Validate GBM distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check initial value parameter (must be positive)
        if (!validation.isValidParameter(parameters.value)) {
            errors.push("Initial value parameter must be a number or a valid time series");
        } else if (typeof parameters.value === 'number' && parameters.value <= 0) {
            errors.push("Initial value must be positive");
        } else if (Array.isArray(parameters.value)) {
            parameters.value.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Initial value at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        // Check drift parameter
        if (!validation.isValidParameter(parameters.drift)) {
            errors.push("Drift parameter must be a number or a valid time series");
        }

        // Check volatility parameter (must be positive)
        if (!validation.isValidParameter(parameters.volatility)) {
            errors.push("Volatility parameter must be a number or a valid time series");
        } else if (typeof parameters.volatility === 'number' && parameters.volatility <= 0) {
            errors.push("Volatility parameter must be positive");
        } else if (Array.isArray(parameters.volatility)) {
            parameters.volatility.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Volatility parameter at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        // Check time step parameter (must be positive)
        if (!validation.isValidParameter(parameters.timeStep)) {
            errors.push("Time step parameter must be a number or a valid time series");
        } else if (typeof parameters.timeStep === 'number' && parameters.timeStep <= 0) {
            errors.push("Time step parameter must be positive");
        } else if (Array.isArray(parameters.timeStep)) {
            parameters.timeStep.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Time step parameter at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get GBM distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Geometric Brownian Motion",
            description: "A continuous-time stochastic process where logarithmic returns follow Brownian motion with drift.",
            applications: "Excellent for modeling price series and financial parameters that evolve over time.",
            examples: "Electricity market prices, carbon credit values, variable tariffs, investment returns over time.",
            parameters: [
                {
                    name: "value",
                    description: "Initial value at t=0",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                },
                {
                    name: "drift",
                    description: "Annual growth rate (2-5% typical)",
                    required: true,
                    type: "number or time series",
                    constraints: "percentage value"
                },
                {
                    name: "volatility",
                    description: "Annual standard deviation (15-30% for electricity prices)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive, percentage value"
                },
                {
                    name: "timeStep",
                    description: "Time step for simulation (years)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive",
                    default: 1
                }
            ],
            examples: [
                {
                    description: "Electricity price model with moderate growth",
                    parameters: { value: 50, drift: 2, volatility: 15, timeStep: 1 }
                },
                {
                    description: "Asset price model with high volatility",
                    parameters: { value: 100, drift: 5, volatility: 25, timeStep: 1 }
                }
            ]
        };
    }

    /**
     * Fit GBM distribution to data points
     * Uses method of moments estimation
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length < 2) {
            throw new Error("At least two data points are required for GBM curve fitting");
        }

        // Extract values and sort by year
        const sortedPoints = [...dataPoints].sort((a, b) => a.year - b.year);
        const values = sortedPoints.map(dp => dp.value);

        // Filter out non-positive values (GBM is defined only for positive values)
        const positiveValues = values.filter(v => v > 0);

        if (positiveValues.length < 2) {
            throw new Error("At least two positive values are required for GBM fitting");
        }

        // Calculate log returns: ln(S_t+1 / S_t)
        const logReturns = [];
        for (let i = 0; i < positiveValues.length - 1; i++) {
            logReturns.push(Math.log(positiveValues[i + 1] / positiveValues[i]));
        }

        // Calculate mean and variance of log returns
        const meanLogReturn = logReturns.reduce((sum, val) => sum + val, 0) / logReturns.length;
        const varLogReturn = logReturns.reduce((sum, val) => sum + Math.pow(val - meanLogReturn, 2), 0) / logReturns.length;

        // Calculate time step (default to 1 if not available)
        let timeStep = 1;
        if (sortedPoints.length >= 2) {
            // Try to infer time step from data points
            const yearDiffs = [];
            for (let i = 0; i < sortedPoints.length - 1; i++) {
                yearDiffs.push(sortedPoints[i + 1].year - sortedPoints[i].year);
            }
            // Use the average year difference as time step
            timeStep = yearDiffs.reduce((sum, val) => sum + val, 0) / yearDiffs.length;
        }

        // Estimate drift and volatility
        // μ = meanLogReturn/timeStep + σ²/2
        // σ² = varLogReturn/timeStep
        const volatility = Math.sqrt(varLogReturn / timeStep) * 100; // Convert to percentage
        const drift = (meanLogReturn / timeStep + varLogReturn / (2 * timeStep)) * 100; // Convert to percentage

        return {
            value: positiveValues[0], // Initial value
            drift: Math.max(drift, -20), // Ensure drift is within reasonable bounds
            volatility: Math.max(volatility, 0.1), // Ensure volatility is positive
            timeStep: timeStep
        };
    }

    // getMeanFormula() {
    //     return (params, year) => {
    //         const value = this.getParameterValue('value', year, 1);
    //         const drift = this.getParameterValue('drift', year, 0);
    //         const timeStep = this.getParameterValue('timeStep', year, 1);
    //         return value * Math.exp(drift * timeStep * year);
    //     };
    // }
    // getStdDevFormula() {
    //     return (params, year) => {
    //         const value = this.getParameterValue('value', year, 1);
    //         const drift = this.getParameterValue('drift', year, 0);
    //         const volatility = this.getParameterValue('volatility', year, 0);
    //         const timeStep = this.getParameterValue('timeStep', year, 1);
    //         const t = timeStep * year;
    //         return value * Math.exp(drift * t) * Math.sqrt(Math.exp(volatility * volatility * t) - 1);
    //     };
    // }
    getMinFormula() {
        return () => 0; // GBM is positive
    }
}

module.exports = GBMDistribution;