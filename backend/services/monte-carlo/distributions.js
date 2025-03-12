// backend/services/monte-carlo/distributions.js
const random = require('random').default;
const jStat = require('jstat');

/**
 * Factory for creating statistical distributions
 */
class DistributionFactory {
  /**
   * Create a distribution based on type and parameters
   * @param {string} type - The distribution type
   * @param {Object} params - Parameters for the distribution
   * @returns {Function} A function that returns random values from the distribution
   */
  static createDistribution(type, params) {
    switch (type.toLowerCase()) {
      case 'normal':
        return random.normal(
          params.mean || 0, 
          params.std || params.stdDev || 1
        );
      
      case 'lognormal':
        return random.logNormal(
          params.mean || 0, 
          params.sigma || params.std || 0.5
        );
      
      case 'triangular':
        return random.triangular(
          params.min || 0, 
          params.mode || params.peak || (params.min + params.max) / 2, 
          params.max || 1
        );
      
      case 'uniform':
        return random.uniform(
          params.min || 0, 
          params.max || 1
        );
      
      case 'weibull':
        return random.weibull(
          params.scale || 1, 
          params.shape || 1
        );
      
      case 'exponential':
        return random.exponential(
          params.lambda || 1
        );
      
      case 'poisson':
        return random.poisson(
          params.lambda || 1
        );
      
      case 'fixed':
        return () => params.value || 0;
        
      default:
        throw new Error(`Unsupported distribution type: ${type}`);
    }
  }

  /**
   * Calculate percentiles from an array of data
   * @param {Array<number>} data - Array of numeric values
   * @param {Array<number>} percentiles - Array of percentiles to calculate (0-100)
   * @returns {Object} Object with percentile values
   */
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