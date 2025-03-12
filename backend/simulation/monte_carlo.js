// backend/simulation/monte_carlo.js
const random = require('random').default;
const seedrandom = require('seedrandom');
const financial = require('financial');

function runSimulation(params) {
  const { general, financing, cost, revenue, riskMitigation, simulation, annualAdjustments } = params;
  const { projectLife, loanDuration } = general;
  const { iterations, seed } = simulation;

  // Seed Math.random for deterministic results
  const originalRandom = Math.random;
  Math.random = seedrandom(seed);

  // Debt service calculation
  let debtService = [];
  if (financing.model === 'Balance-Sheet') {
    const equity = financing.equityInvestment || financing.capex / (1 + financing.debtToEquityRatio);
    const debt = equity * financing.debtToEquityRatio;
    const rate = financing.loanInterestRateBS / 100;
    const payment = financial.pmt(rate, loanDuration, debt) || 0; // Default to 0 if NaN
    debtService = Array(loanDuration).fill(payment);
  } else if (financing.model === 'Project-Finance') {
    const debt = financing.capex * financing.debtToCapexRatio;
    const rate = financing.loanInterestRatePF / 100;
    const payment = financial.pmt(rate, loanDuration, debt) || 0; // Default to 0 if NaN
    debtService = Array(loanDuration).fill(payment);
  }

  // Pre-instantiate distribution thunks
  let escalationDistribution = cost.escalationDistribution === 'Normal'
    ? random.normal(cost.escalationRate / 100, 0.005)
    : random.uniform(0, cost.escalationRate / 100 * 2);
  const uniform0to1 = random.uniform(0, 1);
  let energyProductionNormal = revenue.energyProduction.distribution === 'Normal'
    ? random.normal(revenue.energyProduction.mean, revenue.energyProduction.std)
    : null;
  let electricityPriceNormal = revenue.electricityPrice.type !== 'fixed'
    ? random.normal(50, 5)
    : null;
  let downtimeDistribution = revenue.downtimePerEvent && revenue.downtimePerEvent.scale && revenue.downtimePerEvent.shape
    ? random.weibull(revenue.downtimePerEvent.scale, revenue.downtimePerEvent.shape)
    : null;

  // Initialize arrays for results
  const annualCosts = Array(projectLife).fill().map(() => []);
  const annualRevenues = Array(projectLife).fill().map(() => []);
  const cashFlows = Array(projectLife).fill().map(() => []);
  const irrs = [];
  const minDSCRs = [];

  // Simulation loop
  for (let iter = 0; iter < iterations; iter++) {
    let cumulativeCashFlow = -(financing.capex + financing.devex);
    const yearlyCashFlows = [cumulativeCashFlow];
    let minDSCR = Infinity;

    for (let year = 1; year <= projectLife; year++) {
      // Costs
      let totalCost = 0;
      if (year <= cost.oemTerm) {
        totalCost += cost.fixedOMFee || 0;
      } else {
        const escalation = escalationDistribution();
        totalCost += cost.annualBaseOM * Math.pow(1 + (escalation || 0), year - cost.oemTerm);
      }

      if (uniform0to1() < (cost.failureEventProbability / 100 || 0)) {
        let eventCost = cost.failureEventCost || 0;
        if (riskMitigation.insuranceEnabled) {
          eventCost = Math.max(eventCost - (riskMitigation.insuranceDeductible || 0), 0);
          totalCost += riskMitigation.insurancePremium || 0;
        }
        totalCost += eventCost;
      }
      totalCost += annualAdjustments[year - 1].additionalOM || 0;

      // Revenue
      let energyProduction;
      switch (revenue.energyProduction.distribution) {
        case 'Normal':
          energyProduction = energyProductionNormal ? energyProductionNormal() : 0;
          break;
        case 'Triangular':
          energyProduction = Math.random() * ((revenue.energyProduction.max || 0) - (revenue.energyProduction.min || 0)) + (revenue.energyProduction.min || 0);
          break;
        default:
          energyProduction = revenue.energyProduction.mean || 0;
      }
      const degradationFactor = Math.pow(1 - (revenue.revenueDegradationRate / 100 || 0), year - 1);
      energyProduction *= degradationFactor;

      let price = revenue.electricityPrice.type === 'fixed'
        ? (revenue.electricityPrice.value || 0)
        : (electricityPriceNormal ? electricityPriceNormal() : 0);

      let revenueThisYear = energyProduction * price;
      if (uniform0to1() < (cost.failureEventProbability / 100 || 0)) {
        if (downtimeDistribution) {
          const downtime = downtimeDistribution();
          const lostProduction = energyProduction * (downtime / 8760);
          revenueThisYear -= lostProduction * price;
        }
      }
      revenueThisYear += annualAdjustments[year - 1].additionalRevenue || 0;

      // Cash Flow
      const debtServiceThisYear = year <= loanDuration ? (debtService[year - 1] || 0) : 0;
      const cashFlowBeforeDebt = revenueThisYear - totalCost;
      const dscr = debtServiceThisYear > 0 ? cashFlowBeforeDebt / debtServiceThisYear : Infinity;
      minDSCR = Math.min(minDSCR, dscr);
      const cashFlow = cashFlowBeforeDebt - debtServiceThisYear;
      yearlyCashFlows.push(cashFlow);

      annualCosts[year - 1].push(totalCost);
      annualRevenues[year - 1].push(revenueThisYear);
      cashFlows[year - 1].push(cashFlow);
    }

    const irr = financial.irr(yearlyCashFlows) || 0;
    irrs.push(irr);
    minDSCRs.push(minDSCR);
  }

  // Compute percentiles and additional metrics
  const computePercentiles = (data) => {
    const sorted = data.slice().sort((a, b) => a - b);
    return {
      p10: sorted.length ? sorted[Math.floor(0.1 * sorted.length)] || 0 : 0,
      p50: sorted.length ? sorted[Math.floor(0.5 * sorted.length)] || 0 : 0,
      p75: sorted.length ? sorted[Math.floor(0.75 * sorted.length)] || 0 : 0,
      p90: sorted.length ? sorted[Math.floor(0.9 * sorted.length)] || 0 : 0,
    };
  };

  const averageIRR = irrs.length ? irrs.reduce((sum, irr) => sum + irr, 0) / irrs.length : 0;

  const paybackYears = cashFlows.map((yearlyCash) => {
    let cumulative = -(financing.capex + financing.devex);
    for (let i = 0; i < yearlyCash.length; i++) {
      cumulative += yearlyCash[i];
      if (cumulative > 0) return i + 1;
    }
    return Infinity;
  }).filter(year => year !== Infinity);
  const averagePayback = paybackYears.length ? paybackYears.reduce((sum, year) => sum + year, 0) / paybackYears.length : 0;

  const minDSCRDist = {
    p5: minDSCRs.length ? minDSCRs.sort((a, b) => a - b)[Math.floor(0.05 * minDSCRs.length)] || 0 : 0,
    probBelow1: minDSCRs.length ? minDSCRs.filter(dscr => dscr < 1).length / minDSCRs.length : 0,
  };

  const results = {
    averageIRR,
    irrPercentiles: computePercentiles(irrs),
    averagePayback,
    minDSCRDist,
    intermediateData: {
      annualCosts: {
        total: {
          P50: annualCosts.map(year => computePercentiles(year).p50),
          P75: annualCosts.map(year => computePercentiles(year).p75),
          P90: annualCosts.map(year => computePercentiles(year).p90),
        },
      },
      annualRevenue: {
        P50: annualRevenues.map(year => computePercentiles(year).p50),
        P75: annualRevenues.map(year => computePercentiles(year).p75),
        P90: annualRevenues.map(year => computePercentiles(year).p90),
      },
      dscr: {
        P50: minDSCRs.map(() => computePercentiles(minDSCRs).p50),
      },
    },
  };

  // Restore original Math.random
  Math.random = originalRandom;

  return { success: true, results };
}

module.exports = { runSimulation };