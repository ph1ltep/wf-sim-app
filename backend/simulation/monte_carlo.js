// backend/simulation/monte_carlo.js
const math = require('mathjs');

function calculateIRR(cashflows) {
  // This is a placeholder. In production, use a robust IRR calculation method or library.
  let npv, irr = 0.1, iterations = 100;
  const tolerance = 1e-6;
  while (iterations--) {
    npv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + irr, t + 1);
    }
    if (Math.abs(npv) < tolerance) break;
    // Adjust IRR: simple adjustment (this is a naive approach)
    irr += npv / 1000000;
  }
  return irr;
}

function runSimulation(params, iterations = 10000) {
  let irrResults = [];
  let dscrResults = [];
  
  for (let i = 0; i < iterations; i++) {
    let cashflows = [];
    // Randomize cost escalation and risk events for each iteration
    const costEscalation = math.randomNormal(params.escalationMean, params.escalationStd);
    const riskCost = (Math.random() < params.riskProbability) ? params.riskCost : 0;
    
    for (let t = 1; t <= params.years; t++) {
      const baseCost = params.baseOM * Math.pow((1 + costEscalation), t - 1);
      // Apply risk cost on a specified risk year (if defined)
      const additionalCost = (t === params.riskYear) ? riskCost : 0;
      const annualCost = baseCost + additionalCost;
      const cashflow = params.annualRevenue - annualCost;
      cashflows.push(cashflow);
    }
    
    const irr = calculateIRR(cashflows);
    const dscr = math.mean(cashflows) / params.annualDebtService;
    
    irrResults.push(irr);
    dscrResults.push(dscr);
  }
  
  return {
    irrDistribution: irrResults,
    dscrDistribution: dscrResults,
    averageIRR: math.mean(irrResults),
    averageDSCR: math.mean(dscrResults)
  };
}

module.exports = { runSimulation };
