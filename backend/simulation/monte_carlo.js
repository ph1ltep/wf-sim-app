const math = require('mathjs');
const jstat = require('jstat');
const seedrandom = require('seedrandom');
const financial = require('financial');

const runMonteCarloSimulation = (params) => {
  const {
    projectLife, loanDuration, initialInvestment, baseOM, escalationMean, escalationStd,
    oemTerm, fixedOM, riskEvents, scheduledMaintenance, insurance, otherCosts,
    financing, revenue, simulation
  } = params;

  const { iterations, seed, distributions } = simulation;

  // Seed Math.random for reproducibility
  if (seed) {
    Math.random = seedrandom(seed);
  } else {
    Math.random = seedrandom(); // Uses a random seed if none provided
  }

  let irrResults = [];
  let cashFlows = Array(projectLife + 1).fill(0).map(() => []);
  let dscrResults = Array(projectLife + 1).fill(0).map(() => []);
  let costBreakdown = { routineOM: [], majorRepairs: [], insurancePremiums: [], other: [] };
  let minDSCRs = [];
  let paybackYears = [];

  for (let i = 0; i < iterations; i++) {
    let equityCashFlows = [-initialInvestment];
    let annualCosts = [];
    let annualRevenues = [];
    let cumulativeCash = -initialInvestment;

    for (let year = 1; year <= projectLife; year++) {
      // Revenue Calculation
      const energyProd = sampleDistribution(revenue.energyProduction, distributions.energyProduction);
      const powerPrice = revenue.powerPrice.type === 'fixed'
        ? revenue.powerPrice.value
        : sampleDistribution(revenue.powerPrice, distributions.powerPrice);
      const degradationFactor = Math.pow(1 - revenue.degradationRate, year - 1);
      const otherRevenue = revenue.otherRevenue.reduce((sum, r) => sum + r.annualAmount, 0);
      const yearlyRevenue = energyProd * powerPrice * degradationFactor + otherRevenue;
      annualRevenues.push(yearlyRevenue);

      // Cost Calculation
      let totalCost = 0;
      let routineOM = year <= oemTerm ? fixedOM : baseOM * Math.pow(1 + sampleDistribution({ mean: escalationMean, std: escalationStd }, 'normal'), year - 1);
      totalCost += routineOM;
      costBreakdown.routineOM.push(routineOM);

      // Risk Events
      let repairCost = 0;
      riskEvents.forEach(event => {
        if (year >= event.minYear && year <= event.maxYear && Math.random() < event.probability) {
          let cost = event.costImpact;
          if (insurance.enabled && cost > insurance.deductible) {
            cost = Math.max(cost - (cost - insurance.deductible) * insurance.coveragePercent, insurance.deductible);
          }
          repairCost += cost;
        }
      });
      totalCost += repairCost;
      costBreakdown.majorRepairs.push(repairCost);

      // Scheduled Maintenance
      const maintenanceCost = scheduledMaintenance.filter(m => m.year === year).reduce((sum, m) => sum + m.cost, 0);
      totalCost += maintenanceCost;
      costBreakdown.majorRepairs.push(maintenanceCost);

      // Insurance Premium
      const insuranceCost = insurance.enabled ? insurance.premium : 0;
      totalCost += insuranceCost;
      costBreakdown.insurancePremiums.push(insuranceCost);

      // Other Costs
      const otherCost = otherCosts.reduce((sum, c) => sum + c.annualCost, 0);
      totalCost += otherCost;
      costBreakdown.other.push(otherCost);

      annualCosts.push(totalCost);

      // Cash Flow and DSCR
      const netBeforeDebt = yearlyRevenue - totalCost;
      const debtService = financing.debtService[Math.min(year - 1, financing.debtService.length - 1)];
      const equityCashFlow = netBeforeDebt - debtService;
      equityCashFlows.push(equityCashFlow);
      cashFlows[year].push(equityCashFlow);

      const dscr = debtService > 0 ? netBeforeDebt / debtService : Infinity;
      dscrResults[year].push(dscr);

      // Cumulative Cash and Payback
      cumulativeCash += equityCashFlow;
      if (cumulativeCash >= 0 && !paybackYears[i]) {
        paybackYears[i] = year;
      }
    }

    // IRR and Minimum DSCR
    const irr = financial.irr(equityCashFlows);
    if (!isNaN(irr) && irr !== null) irrResults.push(irr); // Ensure valid IRR
    const minDSCR = Math.min(...dscrResults.slice(1, loanDuration + 1).map(y => Math.min(...y)));
    minDSCRs.push(minDSCR);
  }

  // Aggregate Results with checks for empty arrays
  const averageIRR = irrResults.length > 0 ? math.mean(irrResults) : 0; // Fallback to 0 if empty
  const irrPercentiles = irrResults.length > 0 ? {
    p10: math.quantileSeq(irrResults, 0.1),
    p50: math.median(irrResults),
    p90: math.quantileSeq(irrResults, 0.9)
  } : { p10: 0, p50: 0, p90: 0 };
  const averageCashFlow = cashFlows.map(y => y.length > 0 ? math.mean(y) : 0);
  const averageDSCR = dscrResults.map(y => y.length > 0 ? math.mean(y.filter(d => d !== Infinity)) : 0);
  const minDSCRDist = minDSCRs.length > 0 ? {
    mean: math.mean(minDSCRs),
    p5: math.quantileSeq(minDSCRs, 0.05),
    probBelow1: minDSCRs.filter(d => d < 1).length / iterations
  } : { mean: 0, p5: 0, probBelow1: 0 };
  const avgCostBreakdown = {
    routineOM: costBreakdown.routineOM.length > 0 ? math.mean(costBreakdown.routineOM) : 0,
    majorRepairs: costBreakdown.majorRepairs.length > 0 ? math.mean(costBreakdown.majorRepairs) : 0,
    insurancePremiums: costBreakdown.insurancePremiums.length > 0 ? math.mean(costBreakdown.insurancePremiums) : 0,
    other: costBreakdown.other.length > 0 ? math.mean(costBreakdown.other) : 0
  };
  const averagePayback = paybackYears.length > 0 ? math.mean(paybackYears.filter(y => y !== undefined)) : 0;

  return {
    averageIRR,
    irrDistribution: irrResults,
    irrPercentiles,
    averageCashFlow,
    averageDSCR,
    minDSCRDist,
    avgCostBreakdown,
    averagePayback
  };
};

function sampleDistribution(param, distType) {
  switch (distType) {
    case 'normal':
      return jstat.normal.sample(param.mean, param.std);
    case 'weibull':
      return jstat.weibull.sample(param.scale, param.shape);
    case 'triangle':
      const { min, max, mode } = param;
      const F = (mode - min) / (max - min);
      const U = Math.random();
      if (U < F) {
        return min + Math.sqrt(U * (max - min) * (mode - min));
      } else {
        return max - Math.sqrt((1 - U) * (max - min) * (max - mode));
      }
    case 'fixed':
      return param.value;
    default:
      throw new Error(`Unsupported distribution: ${distType}`);
  }
}

module.exports = { runMonteCarloSimulation };