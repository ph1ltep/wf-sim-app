class WindTurbineFailureModel {
    /**
     * Initializes the model with a MongoDB-compatible input document.
     * @param {Object} input - Input document following the defined schema.
     */
    constructor(input) {
      this.designLife = input.designLife;
      this.totalLifetime = input.totalLifetime;
      this.N = input.N;
      this.P = input.P;
      this.assumedF = input.assumedF || 0.01;
      this.historicalData = input.historicalData || null;
      this.beta = null;       // Shape parameter (Weibull)
      this.eta = null;        // Scale parameter (Weibull)
      this.beta_sd = null;    // Standard deviation of beta
      this.eta_sd = null;     // Standard deviation of eta
    }
  
    /**
     * Estimates Weibull parameters (beta, eta) and their uncertainties based on input data.
     */
    estimateParameters() {
      if (!this.historicalData) {
        // Default case: no historical data
        this.beta = 2.0;
        this.eta = this.designLife / Math.pow(-Math.log(1 - this.assumedF), 1 / this.beta);
        this.beta_sd = 0.2;
        this.eta_sd = 0.1 * this.eta;
      } else if (this.historicalData.type === 'separate') {
        // Historical data from a separate fleet
        const { period, average } = this.historicalData.data;
        const [a, b] = period;
        const numYears = b - a + 1;
        const errorFunc = (beta, eta) => {
          const F_a_minus_1 = a > 1 ? this.weibullCDF(a - 1, beta, eta) : 0;
          const F_b = this.weibullCDF(b, beta, eta);
          const observed = average * numYears;
          const predicted = F_b - F_a_minus_1;
          return Math.pow(predicted - observed, 2);
        };
        const { beta, eta } = this.fitWeibull(errorFunc);
        this.beta = beta;
        this.eta = eta;
        this.beta_sd = 0.1 * beta;
        this.eta_sd = 0.1 * eta;
      } else if (this.historicalData.type === 'analysis') {
        // Historical data for the current fleet
        const data = this.historicalData.data;
        const observedCumulative = data.map((_, t) =>
          data.slice(0, t + 1).reduce((sum, d) => sum + d.failureRate, 0)
        );
        const errorFunc = (beta, eta) => {
          let error = 0;
          data.forEach((d, index) => {
            const pred = this.weibullCDF(d.year, beta, eta);
            error += Math.pow(observedCumulative[index] - pred, 2);
          });
          return error;
        };
        const { beta, eta } = this.fitWeibull(errorFunc);
        this.beta = beta;
        this.eta = eta;
        this.beta_sd = 0.1 * beta;
        this.eta_sd = 0.1 * eta;
      }
    }
  
    /**
     * Runs Monte Carlo simulation to compute failure distributions.
     * @param {number} [numSamples=10000] - Number of simulation samples.
     * @returns {Object} Raw simulation results.
     */
    runSimulation(numSamples = 10000) {
      const failuresByYear = Array(this.totalLifetime).fill().map(() => []);
      const cumulativeFailuresByYear = Array(this.totalLifetime).fill().map(() => []);
  
      for (let s = 0; s < numSamples; s++) {
        const beta = this.normalRandom(this.beta, this.beta_sd);
        const eta = this.normalRandom(this.eta, this.eta_sd);
        let F_prev = 0;
  
        for (let t = 1; t <= this.totalLifetime; t++) {
          const F_t = this.weibullCDF(t, beta, eta);
          const failures = this.N * (F_t - F_prev);
          failuresByYear[t - 1].push(failures);
          cumulativeFailuresByYear[t - 1].push(this.N * F_t);
          F_prev = F_t;
        }
      }
  
      return { failuresByYear, cumulativeFailuresByYear };
    }
  
    /**
     * Computes failure rates and structures the MongoDB-compatible output.
     * @returns {Object} Output document following the defined schema.
     */
    calculateFailureRates() {
      this.estimateParameters();
      const { failuresByYear, cumulativeFailuresByYear } = this.runSimulation();
  
      const output = {
        years: Array.from({ length: this.totalLifetime }, (_, i) => i + 1),
        failureRates: {},
        cumulativeFailureRates: {},
        historicalData: this.historicalData && this.historicalData.type === 'analysis'
          ? this.historicalData.data.map(d => ({ year: d.year, observed: d.failureRate }))
          : []
      };
  
      this.P.forEach(p => {
        output.failureRates[`P${p}`] = failuresByYear.map(yearData => this.percentile(yearData, p));
        output.cumulativeFailureRates[`P${p}`] = cumulativeFailuresByYear.map(yearData => this.percentile(yearData, p));
      });
  
      return output;
    }
  
    // --- Helper Methods ---
  
    /**
     * Computes the Weibull cumulative distribution function (CDF).
     * @param {number} t - Time in years.
     * @param {number} beta - Shape parameter.
     * @param {number} eta - Scale parameter.
     * @returns {number} Probability of failure by time t.
     */
    weibullCDF(t, beta, eta) {
      return 1 - Math.exp(-Math.pow(t / eta, beta));
    }
  
    /**
     * Generates a normally distributed random number.
     * @param {number} mean - Mean of the distribution.
     * @param {number} sd - Standard deviation.
     * @returns {number} Random sample.
     */
    normalRandom(mean, sd) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + sd * z;
    }
  
    /**
     * Computes the percentile of an array of values.
     * @param {number[]} values - Array of numbers.
     * @param {number} p - Percentile (0-100).
     * @returns {number} Value at the given percentile.
     */
    percentile(values, p) {
      const sorted = [...values].sort((a, b) => a - b);
      const index = (p / 100) * (sorted.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return sorted[lower];
      const fraction = index - lower;
      return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
    }
  
    /**
     * Fits Weibull parameters by minimizing an error function.
     * @param {Function} errorFunc - Error function to minimize.
     * @returns {Object} Estimated beta and eta.
     */
    fitWeibull(errorFunc) {
      // Simple grid search for demonstration (replace with a robust optimizer in production)
      let bestBeta = 2.0;
      let bestEta = 10.0;
      let minError = Infinity;
  
      for (let beta = 1.0; beta <= 3.0; beta += 0.1) {
        for (let eta = 5.0; eta <= 20.0; eta += 0.5) {
          const error = errorFunc(beta, eta);
          if (error < minError) {
            minError = error;
            bestBeta = beta;
            bestEta = eta;
          }
        }
      }
      return { beta: bestBeta, eta: bestEta };
    }
  }
  
  // --- Example Usage ---
  const input = {
    designLife: 20,
    totalLifetime: 25,
    N: 100,
    P: [90, 75, 50],
    assumedF: 0.01,
    historicalData: {
      type: "analysis",
      data: [
        { year: 1, failureRate: 0.02 },
        { year: 2, failureRate: 0.03 },
        { year: 3, failureRate: 0.04 }
      ]
    }
  };
  
  const model = new WindTurbineFailureModel(input);
  const result = model.calculateFailureRates();
  console.log(JSON.stringify(result, null, 2));