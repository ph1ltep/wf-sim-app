// backend/services/monte-carlo/distributions.js
const random = require('random').default;
const jStat = require('jstat');

/**
 * Factory for creating statistical distributions
 */
class DistributionFactory {
  /**
   * Create a distribution based on type and parameters
   * @param {Object} distribution - DistributionTypeSchema object or type string
   * @param {Object} options - Additional options
   * @returns {Function} A function that returns random values from the distribution
   */
  static createDistribution(distribution, options = {}) {
    const { type, parameters, timeSeriesMode = false } = distribution;
    const currentYear = options.year || 1;

    // Helper to get parameter value, supporting time series
    const getParam = (paramName, defaultValue) => {
      const paramValue = parameters[paramName];

      if (paramValue === undefined || paramValue === null) {
        return defaultValue;
      }

      if (timeSeriesMode && Array.isArray(paramValue)) {
        const yearPoint = paramValue.find(dp => dp.year === currentYear);
        return yearPoint ? yearPoint.value : defaultValue;
      }

      return paramValue;
    };

    switch (type.toLowerCase()) {
      case 'normal':
        return random.normal(
          getParam('mean', 0),
          getParam('stdDev', 1)
        );

      case 'lognormal':
        return random.logNormal(
          getParam('mean', 0),
          getParam('sigma', 0.5)
        );

      case 'triangular':
        return random.triangular(
          getParam('min', 0),
          getParam('mode', (getParam('min', 0) + getParam('max', 1)) / 2),
          getParam('max', 1)
        );

      case 'uniform':
        return random.uniform(
          getParam('min', 0),
          getParam('max', 1)
        );

      case 'weibull':
        return random.weibull(
          getParam('scale', 1),
          getParam('shape', 2)
        );

      case 'exponential':
        return random.exponential(
          getParam('lambda', 1)
        );

      case 'poisson':
        return random.poisson(
          getParam('lambda', 1)
        );

      case 'fixed':
        return () => getParam('value', 0);

      case 'kaimal':
        return this._createKaimalDistribution(
          getParam('meanWindSpeed', 10),
          getParam('turbulenceIntensity', 0.1),
          getParam('roughnessLength', 0.03),
          getParam('scale', 8.1),
          getParam('hubHeight', 100)
        );

      case 'gbm':
        return this._createGBMDistribution(
          getParam('value', 100),
          getParam('drift', 0.05),
          getParam('volatility', 0.2),
          getParam('timeStep', 1),
          options
        );

      default:
        throw new Error(`Unsupported distribution type: ${type}`);
    }
  }

  static _createKaimalDistribution(meanWindSpeed, turbulenceIntensity, roughnessLength, kaimalScale, hubHeight) {
    const sigma = meanWindSpeed * turbulenceIntensity;
    const karmanConstant = 0.4;
    const frictionVelocity = meanWindSpeed * karmanConstant / Math.log(hubHeight / roughnessLength);
    const baseDistribution = random.normal(meanWindSpeed, sigma);

    return () => {
      let windSpeed = baseDistribution();
      windSpeed = Math.max(0, windSpeed);
      const turbulenceCorrection = this._sampleKaimalSpectrum(frictionVelocity, kaimalScale);
      windSpeed += turbulenceCorrection * sigma;
      return windSpeed;
    };
  }

  static _sampleKaimalSpectrum(frictionVelocity, kaimalScale) {
    const frequency = Math.exp(random.uniform(-5, 0)());
    const normalizedFreq = frequency * kaimalScale / frictionVelocity;
    const spectralDensity = 4 * normalizedFreq / Math.pow(1 + 6 * normalizedFreq, 5 / 3);

    const u1 = Math.random();
    const u2 = Math.random();
    const amplitude = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return amplitude * Math.sqrt(spectralDensity);
  }

  /**
 * Creates a Geometric Brownian Motion distribution function
 * @param {number} initialValue - Starting value (S0)
 * @param {number} drift - Annual drift/growth rate (μ)
 * @param {number} volatility - Annual volatility (σ)
 * @param {number} timeStep - Time step in years (default: 1 year)
 * @param {Object} options - Additional options including current year
 * @returns {Function} A function that returns a GBM sample
 */
  static _createGBMDistribution(initialValue, drift, volatility, timeStep, options = {}) {
    const currentYear = options.year || 1;
    let currentValue = initialValue;

    // If not the first year, calculate value at this point in time
    if (currentYear > 1) {
      // For deterministic path (expectation), we use: S(t) = S0 * exp(μt)
      const timeElapsed = (currentYear - 1) * timeStep;
      currentValue = initialValue * Math.exp(drift * timeElapsed);
    }

    // Create normal distribution for the random component
    const normalDist = random.normal(0, 1);

    return () => {
      // GBM formula: S(t+Δt) = S(t) * exp((μ - σ²/2) * Δt + σ * √Δt * Z)
      const adjustedDrift = drift - (volatility * volatility) / 2;
      const randomComponent = volatility * Math.sqrt(timeStep) * normalDist();
      const growthFactor = Math.exp(adjustedDrift * timeStep + randomComponent);

      return currentValue * growthFactor;
    };
  }

  static calculatePercentiles(data, percentiles = [10, 50, 75, 90]) {
    if (!data || data.length === 0) {
      return percentiles.reduce((acc, p) => {
        acc[`P${p}`] = 0;
        return acc;
      }, {});
    }

    const sorted = [...data].sort((a, b) => a - b);

    return percentiles.reduce((acc, p) => {
      const index = Math.min(
        Math.floor((p / 100) * sorted.length),
        sorted.length - 1
      );
      acc[`P${p}`] = sorted[index];
      return acc;
    }, {});
  }
}

module.exports = DistributionFactory;