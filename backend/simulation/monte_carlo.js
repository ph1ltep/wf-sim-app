const randomNormal = require('random-normal');
const math = require('mathjs');
const financial = require('financial');

const calculateIRR = financial.irr;

function runSimulation(params, iterations = 10000) {
    const {
        years,
        oemTerm,
        fixedOM,
        baseOM,
        escalationMean,
        escalationStd,
        annualRevenue,
        annualDebtService,
        riskEvents,
        initialInvestment
    } = params;

    if (!initialInvestment || isNaN(initialInvestment)) {
        throw new Error("Initial investment is missing or invalid.");
    }
    if (!annualDebtService || annualDebtService <= 0) {
        throw new Error("Annual debt service must be a positive number.");
    }

    let irrResults = [];
    let sumCashflow = new Array(years).fill(0);
    let sumDscr = new Array(years).fill(0);

    for (let i = 0; i < iterations; i++) {
        let cashflows = [-initialInvestment];
        let costEscalation = randomNormal({ mean: escalationMean, dev: escalationStd });
        let occurredRisks = riskEvents.map(event => ({
            ...event,
            occurs: Math.random() < event.riskProbability
        }));

        for (let t = 1; t <= years; t++) {
            let omCost;
            if (t <= oemTerm) {
                omCost = fixedOM;
            } else {
                omCost = baseOM * Math.pow(1 + costEscalation, t - oemTerm - 1);
                occurredRisks.forEach(event => {
                    if (event.riskYear === t && event.occurs) {
                        omCost += event.riskCost;
                    }
                });
            }
            let cashflowBeforeDebt = annualRevenue - omCost;
            let cashflow = cashflowBeforeDebt - annualDebtService;
            let dscr = cashflowBeforeDebt / annualDebtService;
            cashflows.push(cashflow);
            sumCashflow[t - 1] += cashflow;
            sumDscr[t - 1] += dscr;
        }

        let irr = calculateIRR(cashflows);
        if (!isNaN(irr) && irr !== Infinity) {
            irrResults.push(irr);
        }
    }

    const averageCashflow = sumCashflow.map(sum => sum / iterations);
    const averageDscr = sumDscr.map(sum => sum / iterations);
    const averageIRR = irrResults.length > 0 ? math.mean(irrResults) : null;

    return {
        irrDistribution: irrResults,
        averageIRR,
        averageCashflow,
        averageDscr
    };
}

module.exports = { runSimulation };