// src/utils/cashflow/transformers/financingTransformer.js - Updated to new signature

/**
 * Transform construction schedule to debt drawdown schedule
 * @param {Array} dataSource - Primary data: costSources array
 * @param {Object} dataReferences - Reference data: {reference: {financing}, global: {projectLife, numWTGs, currency}, context: {}}
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects for debt drawdown
 */
export const debtDrawdownToAnnualCosts = (dataSource, dataReferences, sourceConfig) => {
    const costSources = dataSource;
    const financing = dataReferences.reference.financing;
    const { projectLife, numWTGs } = dataReferences.global;

    if (!financing) {
        console.warn('debtDrawdownToAnnualCosts: No financing data available in references');
        return [];
    }

    if (!Array.isArray(costSources) || costSources.length === 0) {
        console.warn('debtDrawdownToAnnualCosts: No construction cost sources found in dataSource');
        return [];
    }

    try {
        // Get debt financing ratio (convert % to decimal)
        const debtFinancingRatio = (financing.debtFinancingRatio || 70) / 100;

        console.log(`💰 Processing debt drawdown with ${debtFinancingRatio * 100}% debt financing ratio`);

        // Calculate debt drawdown by year
        const debtDrawdownByYear = new Map();

        costSources.forEach(source => {
            const sourceAmount = source?.totalAmount || 0;
            const drawdownSchedule = source?.drawdownSchedule || [];
            const sourceName = source?.name || 'Unknown Source';

            if (sourceAmount === 0) {
                console.warn(`💰 Source '${sourceName}' has zero amount`);
                return;
            }

            drawdownSchedule.forEach(item => {
                if (typeof item.year === 'number' && typeof item.value === 'number') {
                    const capexAmount = (item.value / 100) * sourceAmount;
                    const debtAmount = capexAmount * debtFinancingRatio;

                    const currentDebt = debtDrawdownByYear.get(item.year) || 0;
                    debtDrawdownByYear.set(item.year, currentDebt + debtAmount);
                }
            });
        });

        // Convert to DataPointSchema array
        const debtDrawdown = Array.from(debtDrawdownByYear.entries())
            .map(([year, amount]) => ({
                year: parseInt(year),
                value: amount
            }))
            .sort((a, b) => a.year - b.year);

        const totalDebtDrawn = debtDrawdown.reduce((sum, item) => sum + item.value, 0);
        console.log(`💰 Debt drawdown: ${debtDrawdown.length} years, total ${totalDebtDrawn.toLocaleString()}`);

        return debtDrawdown;

    } catch (error) {
        console.error('debtDrawdownToAnnualCosts: Error processing debt drawdown:', error);
        return [];
    }
};

/**
 * Calculate Interest During Construction (IDC)
 * @param {Array} dataSource - Primary data: costSources array
 * @param {Object} dataReferences - Reference data: {reference: {financing}, global: {projectLife, numWTGs, currency}, context: {}}
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects for IDC
 */
export const interestDuringConstruction = (dataSource, dataReferences, sourceConfig) => {
    const costSources = dataSource;
    const financing = dataReferences.reference.financing;
    const { projectLife } = dataReferences.global;

    if (!financing) {
        console.warn('interestDuringConstruction: No financing data available in references');
        return [];
    }

    try {
        // Check if IDC should be capitalized
        const shouldCapitalize = financing.idcCapitalization !== false; // Default to true

        if (!shouldCapitalize) {
            console.log('🏗️ IDC not capitalized - returning empty array');
            return [];
        }

        // Get debt drawdown schedule using the same transformer
        const debtDrawdown = debtDrawdownToAnnualCosts(dataSource, dataReferences, sourceConfig);
        const constructionDebtRate = (financing.costOfConstructionDebt || 4) / 100; // Convert % to decimal

        if (debtDrawdown.length === 0) {
            console.warn('interestDuringConstruction: No debt drawdown schedule available');
            return [];
        }

        // Calculate IDC year by year
        const idcByYear = [];
        let cumulativeDebt = 0;

        // Sort by year to ensure proper cumulative calculation
        const sortedDrawdown = debtDrawdown.sort((a, b) => a.year - b.year);

        sortedDrawdown.forEach(drawdown => {
            // Add this year's drawdown to cumulative debt
            cumulativeDebt += drawdown.value;

            // Calculate interest on average debt balance during the year
            // Assumption: debt is drawn evenly throughout the year, so average balance is 
            // (beginning balance + ending balance) / 2
            const beginningBalance = cumulativeDebt - drawdown.value;
            const endingBalance = cumulativeDebt;
            const averageBalance = (beginningBalance + endingBalance) / 2;

            const annualInterest = averageBalance * constructionDebtRate;

            if (annualInterest > 0) {
                idcByYear.push({
                    year: drawdown.year,
                    value: annualInterest
                });
            }
        });

        const totalIDC = idcByYear.reduce((sum, item) => sum + item.value, 0);
        console.log(`🏗️ IDC: ${idcByYear.length} years, total ${totalIDC.toLocaleString()}`);

        return idcByYear;

    } catch (error) {
        console.error('interestDuringConstruction: Error calculating IDC:', error);
        return [];
    }
};

/**
 * Calculate operational debt service schedule
 * @param {Array} dataSource - Primary data: costSources array
 * @param {Object} dataReferences - Reference data: {reference: {financing}, global: {projectLife, numWTGs, currency}, context: {}}
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects for debt service
 */
export const operationalDebtService = (dataSource, dataReferences, sourceConfig) => {
    const costSources = dataSource;
    const financing = dataReferences.reference.financing;
    const { projectLife } = dataReferences.global;

    if (!financing) {
        console.warn('operationalDebtService: No financing data available in references');
        return [];
    }

    try {
        // Get total debt amount (construction drawdown + IDC if capitalized)
        const debtDrawdown = debtDrawdownToAnnualCosts(dataSource, dataReferences, sourceConfig);
        const idc = interestDuringConstruction(dataSource, dataReferences, sourceConfig);

        const totalDebtDrawn = debtDrawdown.reduce((sum, item) => sum + item.value, 0);
        const totalIDC = idc.reduce((sum, item) => sum + item.value, 0);
        const totalDebtPrincipal = totalDebtDrawn + totalIDC;

        if (totalDebtPrincipal <= 0) {
            console.warn('operationalDebtService: No debt principal to service');
            return [];
        }

        // Get financing parameters
        const operationalRate = (financing.costOfOperationalDebt || 5) / 100;
        const loanDuration = financing.loanDuration || 15;
        const gracePeriod = financing.gracePeriod || 1;
        const amortizationType = financing.amortizationType || 'amortizing';

        // Calculate debt service schedule
        const debtService = [];
        const debtServiceStartYear = 1 + gracePeriod; // After COD + grace period

        if (amortizationType === 'bullet') {
            // Bullet loan: interest only, then principal at maturity
            for (let year = debtServiceStartYear; year <= projectLife && year <= loanDuration; year++) {
                const isMaturityYear = year === loanDuration;
                const interestPayment = totalDebtPrincipal * operationalRate;
                const principalPayment = isMaturityYear ? totalDebtPrincipal : 0;
                const totalPayment = interestPayment + principalPayment;

                debtService.push({
                    year,
                    value: totalPayment
                });
            }
        } else {
            // Amortizing loan: equal annual payments
            const annualPayment = totalDebtPrincipal *
                (operationalRate * Math.pow(1 + operationalRate, loanDuration)) /
                (Math.pow(1 + operationalRate, loanDuration) - 1);

            for (let year = debtServiceStartYear; year <= projectLife && year <= (debtServiceStartYear + loanDuration - 1); year++) {
                debtService.push({
                    year,
                    value: annualPayment
                });
            }
        }

        const totalDebtService = debtService.reduce((sum, item) => sum + item.value, 0);
        console.log(`💳 Debt service: ${debtService.length} years, total ${totalDebtService.toLocaleString()}, principal ${totalDebtPrincipal.toLocaleString()}`);

        return debtService;

    } catch (error) {
        console.error('operationalDebtService: Error calculating debt service:', error);
        return [];
    }
};