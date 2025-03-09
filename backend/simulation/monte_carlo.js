// backend/simulation/monte_carlo.js
const math = require('mathjs');

// Helper function: sample from Normal distribution using Box-Muller
function sampleNormal(mean, std) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Avoid zero
  while(v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + std * z;
}

// Helper function: sample from Weibull distribution
// Formula: sample = scale * (-ln(1 - u))^(1/shape)
function sampleWeibull(shape, scale) {
  let u = Math.random();
  return scale * Math.pow(-Math.log(1 - u), 1 / shape);
}

// Helper function: sample from Triangle distribution
function sampleTriangle(min, mode, max) {
  let u = Math.random();
  let c = (mode - min) / (max - min);
  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

// Helper function: Calculate IRR using the Newton-Raphson method
function calculateIRR(cashflows, guess = 0.1) {
  const maxIter = 1000;
  const tol = 1e-6;
  let rate = guess;
  
  function npv(rate) {
    return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
  }
  
  function npvDerivative(rate) {
    return cashflows.reduce((acc, cf, t) => acc - t * cf / Math.pow(1 + rate, t + 1), 0);
  }
  
  for (let i = 0; i < maxIter; i++) {
    let value = npv(rate);
    let derivative = npvDerivative(rate);
    if (Math.abs(derivative) < tol) break;
    let newRate = rate - value / derivative;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return rate;
}

// Main Monte Carlo simulation function
// params: an object containing all simulation parameters
// Expected structure of params (example):
// {
//   projectLife: Number,
//   loanDuration: Number,
//   initialInvestment: Number,
//   baseOM: Number,
//   escalationMean: Number,      // e.g., 0.02 for 2% mean escalation
//   escalationStd: Number,       // e.g., 0.005
//   oemTerm: Number,             // fixed-cost period in years
//   fixedOM: Number,             // fixed annual cost during OEM term
//   riskEvents: [                // array of risk events
//      { description: String, minYear: Number, maxYear: Number, weibullShape: Number, weibullScale: Number, costImpact: Number }
//   ],
//   windResource: {              // parameters for wind resource variability
//      baseProduction: Number,   // base annual production in MWh (or other units)
//      weibullShape: Number,     
//      weibullScale: Number
//   },
//   powerPrice: {                // triangle distribution for power price ($/MWh)
//      min: Number,
//      mode: Number,
//      max: Number
//   },
//   debtService: Number,         // annual debt service cost
//   // Additional financing inputs can be added here
//   iterations: Number,          // number of simulation iterations (optional)
// }
function runSimulation(params, iterations = 10000) {
  let irrResults = [];
  let projectLife = params.projectLife;
  let loanDuration = params.loanDuration;
  
  // Prepare arrays to aggregate cash flow and DSCR for each year
  let annualCashFlowSums = Array(projectLife + 1).fill(0); // index 0 is initial investment
  let annualDscrSums = Array(loanDuration + 1).fill(0);
  
  for (let i = 0; i < iterations; i++) {
    let cashFlows = [];
    // Year 0: initial investment (negative cash flow)
    cashFlows[0] = -params.initialInvestment;
    
    for (let t = 1; t <= projectLife; t++) {
      // Calculate O&M cost:
      let omCost = 0;
      if (t <= params.oemTerm) {
        // During OEM term, use fixed O&M cost
        omCost = params.fixedOM;
      } else {
        // Post OEM: escalate the base O&M cost using a randomly sampled escalation rate
        let escalationRate = sampleNormal(params.escalationMean, params.escalationStd);
        omCost = params.baseOM * Math.pow(1 + escalationRate, (t - params.oemTerm));
      }
      
      // Calculate failure events cost for year t
      let failureCostTotal = 0;
      if (params.riskEvents && Array.isArray(params.riskEvents)) {
        for (let event of params.riskEvents) {
          if (t >= event.minYear && t <= event.maxYear) {
            // Sample a failure time from a Weibull distribution for this event
            let failureTime = sampleWeibull(event.weibullShape, event.weibullScale);
            if (Math.round(failureTime) === t) {
              failureCostTotal += event.costImpact;
            }
          }
        }
      }
      
      let totalOMCost = omCost + failureCostTotal;
      
      // Calculate annual energy production using Weibull for wind resource variability
      // Multiply the base production by a sampled factor
      let energyProductionFactor = sampleWeibull(params.windResource.weibullShape, params.windResource.weibullScale);
      let energyProduction = params.windResource.baseProduction * energyProductionFactor;
      
      // Determine power price using a Triangle distribution
      let price = sampleTriangle(params.powerPrice.min, params.powerPrice.mode, params.powerPrice.max);
      
      // Calculate revenue for the year
      let revenue = energyProduction * price;
      
      // Net cash flow before debt = revenue - total O&M cost
      let netCashFlowBeforeDebt = revenue - totalOMCost;
      
      // Debt service (if within loan duration)
      let debtService = (t <= loanDuration) ? params.debtService : 0;
      
      let netCashFlowAfterDebt = netCashFlowBeforeDebt - debtService;
      cashFlows[t] = netCashFlowAfterDebt;
      
      // Calculate DSCR for year t (if debt service exists)
      let dscr = (debtService > 0) ? (netCashFlowBeforeDebt / debtService) : null;
      if (t <= loanDuration && dscr !== null) {
        annualDscrSums[t] += dscr;
      }
      
      // Accumulate cash flow sums for averaging later
      annualCashFlowSums[t] += netCashFlowAfterDebt;
    }
    
    // Calculate IRR for this simulation iteration
    let irr = calculateIRR(cashFlows);
    if (!isNaN(irr) && isFinite(irr)) {
      irrResults.push(irr);
    }
  }
  
  // Compute average cash flows and DSCR per year
  let avgCashFlows = annualCashFlowSums.map(sum => sum / iterations);
  let avgDscr = annualDscrSums.map(sum => sum / iterations);
  
  // Compute average IRR
  let avgIRR = irrResults.reduce((acc, val) => acc + val, 0) / irrResults.length;
  
  // Compute percentiles for IRR (e.g., P10, P50, P90)
  let sortedIRRs = irrResults.slice().sort((a, b) => a - b);
  let irrP10 = sortedIRRs[Math.floor(0.10 * sortedIRRs.length)];
  let irrP50 = sortedIRRs[Math.floor(0.50 * sortedIRRs.length)];
  let irrP90 = sortedIRRs[Math.floor(0.90 * sortedIRRs.length)];
  
  return {
    averageCashFlow: avgCashFlows,
    averageDSCR: avgDscr,
    averageIRR: avgIRR,
    irrPercentiles: {
      p10: irrP10,
      p50: irrP50,
      p90: irrP90
    },
    irrDistribution: irrResults
  };
}

module.exports = { runSimulation };
