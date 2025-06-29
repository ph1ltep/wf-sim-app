// frontend/src/utils/cashflow/metrics/foundational/debtService.js
/**
 * Calculate debt service schedule from financing parameters
 * @param {Object} input - MetricInputSchema
 * @returns {Object} MetricResult with debt service time-series
 */
export const calculate = (input) => {
    const { rawData, options = {} } = input;
    const { computationScenario, getValueByPath } = rawData;

    try {
        // Extract financing parameters using registry paths
        const financing = getValueByPath(['settings', 'modules', 'financing']);

        if (!financing || !financing.debtAmount || !financing.debtTerm) {
            return {
                value: [],
                formatted: "No Data",
                error: 'No financing parameters available for debt service calculation',
                metadata: { calculationMethod: 'debtService', hasData: false }
            };
        }

        const {
            debtAmount,
            debtTerm,
            interestRate = 0.05, // Default 5%
            paymentType = 'equalPayments'
        } = financing;

        const monthlyRate = interestRate / 12;
        const totalPayments = debtTerm * 12;
        let debtServiceData = [];

        if (paymentType === 'equalPayments') {
            // Equal monthly payments (typical for project finance)
            const monthlyPayment = debtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
                (Math.pow(1 + monthlyRate, totalPayments) - 1);
            const annualPayment = monthlyPayment * 12;

            for (let year = 1; year <= debtTerm; year++) {
                debtServiceData.push({ year, value: annualPayment });
            }
        } else {
            // Equal principal payments
            const annualPrincipal = debtAmount / debtTerm;
            let remainingBalance = debtAmount;

            for (let year = 1; year <= debtTerm; year++) {
                const annualInterest = remainingBalance * interestRate;
                const totalPayment = annualPrincipal + annualInterest;

                debtServiceData.push({ year, value: totalPayment });
                remainingBalance -= annualPrincipal;
            }
        }

        return {
            value: debtServiceData,
            formatted: "Time Series",
            error: null,
            metadata: {
                calculationMethod: 'debtService',
                hasData: true,
                periods: debtServiceData.length,
                debtAmount,
                debtTerm,
                interestRate: interestRate * 100,
                paymentType
            }
        };

    } catch (error) {
        return {
            value: [],
            formatted: "Error",
            error: `Debt service calculation failed: ${error.message}`,
            metadata: { calculationMethod: 'debtService', hasData: false }
        };
    }
};

export const format = (value) => {
    if (!Array.isArray(value) || value.length === 0) return 'No Data';
    return 'Time Series';
};

export const formatImpact = (impact) => 'N/A';

export const metadata = {
    name: 'Debt Service',
    shortName: 'DebtSvc',
    description: 'Debt service schedule including principal and interest payments',
    units: 'timeSeries',
    displayUnits: 'USD',
    windIndustryStandard: true,
    calculationComplexity: 'medium'
};