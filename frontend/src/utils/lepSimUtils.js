// frontend/src/utils/lepSimUtils.js
import _ from 'lodash';

// Enhanced LEP specifications with per-type repair configurations
export const LEP_SPECIFICATIONS = {
    'No LEP': {
        P_base: 1.0,
        calibration: {
            tipSpeed: 80.0,
            years: 2.0,
            rainfall: 1200.0,
            targetLoss: 2.0,
            testConditions: "Industry standard baseline conditions",
            source: "IEA Wind Task 46 reference data"
        },
        installationPenalty: 0.0,
        defaultConfig: {
            lepLength: 0,
            repairInterval: 10,
            repairEffectiveness: 0.0
        },
        color: '#ff4d4f' // Red
    },
    '3M Tape': {
        P_base: 5.0,
        calibration: {
            tipSpeed: 80.0,
            years: 5.0,
            rainfall: 1200.0,
            targetLoss: 2.0,
            testConditions: "3M laboratory and field testing",
            source: "3M Wind Blade Protection Tape technical data"
        },
        installationPenalty: 0.03,
        defaultConfig: {
            lepLength: 26,
            repairInterval: 8,
            repairEffectiveness: 0.7
        },
        color: '#1890ff' // Blue
    },
    'Poly Shells': {
        P_base: 15.0,
        calibration: {
            tipSpeed: 80.0,
            years: 20.0,
            rainfall: 1200.0,
            targetLoss: 2.0,
            testConditions: "Extended field testing program",
            source: "Polytech A/S PowerEdge performance data"
        },
        installationPenalty: 0.03,
        defaultConfig: {
            lepLength: 30,
            repairInterval: 12,
            repairEffectiveness: 0.85
        },
        color: '#52c41a' // Green
    }
};

// LEP length per type (meters)
export const LEP_LENGTHS = {
    'No LEP': 0.0,
    '3M Tape': 26.0,
    'Poly Shells': 26.0
};

// IEA AEP loss mapping table (wind speed -> [L2, L3, L4] levels)
export const IEA_AEP_TABLE = {
    4.0: [1.0, 1.9, 3.0],
    6.0: [0.9, 1.6, 2.6],
    7.5: [0.7, 1.3, 2.2],
    8.5: [0.6, 1.1, 1.9],
    10.0: [0.4, 0.8, 1.6]
};

// Default input parameters
export const DEFAULT_PARAMETERS = {
    lifespan: 25.0,
    tipSpeed: 85.0,                 // USER CONFIGURABLE: Operating tip speed
    bladeLength: 63.0,
    velocityExponent: 7.5,
    annualRainfall: 1200.0,
    meanWindSpeed: 7.5,
    calibrationRainfall: 1200.0,
    lepLength: 26.0,
    repairEnabled: false,
    repairInterval: 10,
    repairEffectiveness: 0.8,

    // INTERNAL CONSTANT: Industry reference for calibration consistency
    _referenceSpeed: 80.0           // Hidden from UI, used for physics consistency
};

/**
 * Get calibration details for display in UI
 * @param {Object} calibratedTypes - Result from calibrateLEPTypes
 * @returns {Array} Calibration details for each LEP type
 */
export function getCalibrationDetails(calibratedTypes) {
    return Object.entries(calibratedTypes).map(([name, config]) => ({
        name,
        testConditions: config.calibration,
        calibratedP: config.P,
        scalingFactor: config.calibrationResults?.scalingFromBase || 1,
        installationPenalty: config.installationPenalty,
        source: config.calibration.source
    }));
}

/**
 * Get rainfall and wind speed from simulation data
 * @param {Object} scenarioData - Scenario data from context
 * @param {number} percentile - Selected percentile (0-100)
 * @returns {Object} Rainfall and wind speed values
 */
export function getSimulationInputs(scenarioData, percentile = 50) {
    const rainfallSim = scenarioData?.simulation?.inputSim?.distributionAnalysis?.rainfallAmount;
    const windSim = scenarioData?.simulation?.inputSim?.distributionAnalysis?.windVariability;

    let rainfall = DEFAULT_PARAMETERS.annualRainfall;
    let windSpeed = DEFAULT_PARAMETERS.meanWindSpeed;

    if (rainfallSim?.results?.length > 0) {
        // Find the closest percentile result
        const rainfallResult = rainfallSim.results.find(r =>
            Math.abs(r.percentile.value - percentile) < 0.1
        ) || rainfallSim.results[0];

        if (rainfallResult?.data?.length > 0) {
            // Use the first year value or average if multiple years
            rainfall = rainfallResult.data[0]?.value || rainfall;
        }
    }

    if (windSim?.results?.length > 0) {
        const windResult = windSim.results.find(r =>
            Math.abs(r.percentile.value - percentile) < 0.1
        ) || windSim.results[0];

        if (windResult?.data?.length > 0) {
            windSpeed = windResult.data[0]?.value || windSpeed;
        }
    }

    return { rainfall, windSpeed };
}

/**
 * Calculate erosion state considering repair schedule
 * @param {number} year - Current year
 * @param {number} cumulativeRain - Total rainfall up to this year
 * @param {Object} repairConfig - Repair configuration
 * @returns {Object} Effective cumulative rainfall and repair factor
 */
export function calculateRepairAdjustedErosion(year, cumulativeRain, repairConfig) {
    if (!repairConfig.enabled) {
        return {
            effectiveCumRain: cumulativeRain,
            repairFactor: 1.0,
            lastRepairYear: 0
        };
    }

    const { interval, effectiveness } = repairConfig;
    const lastRepairYear = Math.floor((year - 1) / interval) * interval;
    const yearsSinceRepair = year - lastRepairYear;

    // Calculate how much erosion was "reset" by repairs
    let effectiveCumRain = cumulativeRain;
    if (lastRepairYear > 0) {
        const erosionReduced = cumulativeRain * effectiveness;
        effectiveCumRain = cumulativeRain - erosionReduced + (yearsSinceRepair * DEFAULT_PARAMETERS.annualRainfall);
    }

    return {
        effectiveCumRain,
        repairFactor: effectiveness,
        lastRepairYear
    };
}

/**
 * Robust calibration system that handles different test conditions per LEP type
 * @param {Object} currentParams - Current analysis parameters
 * @returns {Object} Calibrated LEP protection factors
 */
export function calibrateLEPTypes(currentParams) {
    const { _referenceSpeed, velocityExponent, bladeLength } = currentParams;

    const calibratedTypes = {};

    Object.entries(LEP_SPECIFICATIONS).forEach(([name, spec]) => {
        const { P_base, calibration, installationPenalty = 0 } = spec;

        // Use the specific test conditions for this LEP type
        const testTipSpeed = calibration.tipSpeed;
        const testYears = calibration.years;
        const testRainfall = calibration.rainfall;
        const targetLoss = calibration.targetLoss;

        // Calculate cumulative rainfall under test conditions
        const cumRainTest = testRainfall * testYears;

        // Calculate tip speed ratio under test conditions
        const testTipSpeedRatio = Math.pow(testTipSpeed / _referenceSpeed, velocityExponent);

        // Target erosion factor
        const fDesired = targetLoss / 100.0;

        // Solve for protection factor P:
        // At tip: f = cumRainTest * 1.0 * testTipSpeedRatio / (P * 1000)
        // So: P = cumRainTest * testTipSpeedRatio / (fDesired * 1000)
        const calibratedP = cumRainTest * testTipSpeedRatio / (fDesired * 1000);

        calibratedTypes[name] = {
            ...spec,
            P: calibratedP,
            installationPenalty,
            calibrationResults: {
                calibratedProtectionFactor: calibratedP,
                testConditions: calibration,
                scalingFromBase: calibratedP / P_base
            }
        };
    });

    return calibratedTypes;
}

/**
 * Map power loss percentage to AEP loss percentage using IEA table
 * @param {number} powerLoss - Power loss percentage
 * @param {number} windSpeed - Mean wind speed (m/s)
 * @returns {number} AEP loss percentage
 */
export function powerToAEPLoss(powerLoss, windSpeed) {
    // Find closest wind speeds in table
    const windSpeeds = Object.keys(IEA_AEP_TABLE).map(Number).sort((a, b) => a - b);
    let lowerSpeed = windSpeeds[0];
    let upperSpeed = windSpeeds[windSpeeds.length - 1];

    for (let i = 0; i < windSpeeds.length - 1; i++) {
        if (windSpeed >= windSpeeds[i] && windSpeed <= windSpeeds[i + 1]) {
            lowerSpeed = windSpeeds[i];
            upperSpeed = windSpeeds[i + 1];
            break;
        }
    }

    // Get AEP levels for interpolation
    const [l2_lower, l3_lower, l4_lower] = IEA_AEP_TABLE[lowerSpeed];
    const [l2_upper, l3_upper, l4_upper] = IEA_AEP_TABLE[upperSpeed];

    // Interpolate AEP levels based on wind speed
    const ratio = lowerSpeed === upperSpeed ? 0 : (windSpeed - lowerSpeed) / (upperSpeed - lowerSpeed);
    const l2 = l2_lower + ratio * (l2_upper - l2_lower);
    const l3 = l3_lower + ratio * (l3_upper - l3_lower);
    const l4 = l4_lower + ratio * (l4_upper - l4_lower);

    // Extend levels for interpolation
    const l1 = (l2 / 1.5) * 0.5;
    const l5 = (l4 / 3.5) * 5.0;
    const l6 = l5 * 2;
    const l7 = l6 * 2;

    const powerPoints = [0.0, 0.5, 1.5, 2.5, 3.5, 5.0, 10.0, 20.0];
    const aepPoints = [0.0, l1, l2, l3, l4, l5, l6, l7];

    // Linear interpolation
    return interpolateLinear(powerLoss, powerPoints, aepPoints);
}

/**
 * Calculate blade-averaged power loss for given conditions
 * @param {number} cumRain - Cumulative rainfall (mm)
 * @param {number} P - Protection factor
 * @param {number} lepLength - LEP length (m)
 * @param {number} baseP - Base protection factor for No LEP
 * @param {Object} params - Input parameters
 * @returns {number} Blade-averaged power loss percentage
 */
export function calculateBladeAveragedPowerLoss(cumRain, P, lepLength, baseP, params) {
    const { bladeLength, tipSpeed, velocityExponent, _referenceSpeed } = params;
    const numPoints = 100;

    // Generate radial positions
    const r = [];
    for (let i = 0; i < numPoints; i++) {
        r.push(0.01 + (i / (numPoints - 1)) * (bladeLength - 0.01));
    }

    // Calculate protection factor along blade
    const P_r = r.map(radius => radius >= (bladeLength - lepLength) ? P : baseP);

    // PHYSICS: Proper erosion calculation with reference speed
    const f_r = r.map((radius, i) => {
        // Radial position effect
        const radiusRatio = Math.pow(radius / bladeLength, velocityExponent);

        // Local speed at this radius
        const localSpeed = (radius / bladeLength) * tipSpeed;

        // Compare to fixed industry reference for consistent calibration
        const localSpeedRatio = Math.pow(localSpeed / _referenceSpeed, velocityExponent);

        return cumRain * radiusRatio * localSpeedRatio / (P_r[i] * 1000.0);
    });

    // Convert to power loss percentage
    const L_r = f_r.map(f => f * 100.0);

    // Calculate power contribution weights (~ r^2)
    const weight = r.map(radius => Math.pow(radius, 2));

    // Trapezoidal integration
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < numPoints - 1; i++) {
        const avgLoss = (L_r[i] + L_r[i + 1]) / 2;
        const avgWeight = (weight[i] + weight[i + 1]) / 2;
        const dr = r[i + 1] - r[i];
        weightedSum += avgLoss * avgWeight * dr;
        totalWeight += avgWeight * dr;
    }

    return weightedSum / totalWeight;
}

/**
 * Calculate AEP loss contribution per meter along blade
 * @param {number} cumRain - Cumulative rainfall (mm)
 * @param {number} P - Protection factor
 * @param {number} lepLength - LEP length (m)
 * @param {number} baseP - Base protection factor
 * @param {number} avgWindSpeed - Average wind speed
 * @param {number} penaltyPerM - Installation penalty per meter
 * @param {Object} params - Input parameters
 * @returns {Array} AEP loss contribution per meter
 */
export function calculateAEPLossPerMeter(cumRain, P, lepLength, baseP, avgWindSpeed, penaltyPerM, params) {
    const { bladeLength, tipSpeed, _referenceSpeed, velocityExponent } = params;
    const numPoints = 100;

    // Generate radial positions
    const r = [];
    for (let i = 0; i < numPoints; i++) {
        r.push(0.01 + (i / (numPoints - 1)) * (bladeLength - 0.01));
    }
    const dr = r[1] - r[0];

    // Calculate protection factor along blade
    const P_r = r.map(radius => radius >= (bladeLength - lepLength) ? P : baseP);

    // Calculate local erosion and AEP loss with proper physics
    const contrib_r = r.map((radius, i) => {
        const radiusRatio = Math.pow(radius / bladeLength, velocityExponent);

        // CORRECTED: Use proper local speed calculation
        const localSpeed = (radius / bladeLength) * tipSpeed;
        const localSpeedRatio = Math.pow(localSpeed / _referenceSpeed, velocityExponent);

        const f = cumRain * radiusRatio * localSpeedRatio / (P_r[i] * 1000.0);
        const powerLoss = f * 100.0;
        const aepLoss = powerToAEPLoss(powerLoss, avgWindSpeed);

        // Power contribution weight (r^2 for area scaling)
        const weight = Math.pow(radius, 2);

        // Calculate total weight for normalization
        const totalWeight = r.reduce((sum, rad) => sum + Math.pow(rad, 2) * dr, 0);

        // Contribution per meter
        let contribution = aepLoss * (weight / totalWeight) / dr;

        // Add installation penalty for protected region
        if (radius >= (bladeLength - lepLength)) {
            contribution += penaltyPerM;
        }

        return contribution;
    });

    return { positions: r, contributions: contrib_r };
}

/**
 * Generate time series data for AEP loss over years
 * @param {Object} params - Input parameters
 * @param {Object} calibratedTypes - Calibrated LEP types
 * @returns {Object} Chart data for AEP loss over time
 */
// Updated generation function for per-type configurations
export function generateAEPLossOverTime(params, calibratedTypes, lepConfigs) {
    const { lifespan, annualRainfall, meanWindSpeed } = params;
    const years = _.range(1, Math.floor(lifespan) + 1);

    // Generate cumulative rainfall
    const cumRainfall = [];
    let cumulativeSum = 0;
    for (let i = 0; i < Math.floor(lifespan); i++) {
        cumulativeSum += annualRainfall;
        cumRainfall.push(cumulativeSum);
    }

    const data = {};
    const baseP = calibratedTypes['No LEP'].P;

    Object.entries(calibratedTypes).forEach(([name, config]) => {
        const lepConfig = lepConfigs[name];
        const actualLepLength = lepConfig.lepLength;
        const penaltyPerM = config.installationPenalty;

        const repairConfig = {
            enabled: lepConfig.repairEnabled,
            interval: lepConfig.repairInterval,
            effectiveness: lepConfig.repairEffectiveness
        };

        const aepLossOverTime = years.map((year, i) => {
            const cumRain = cumRainfall[i];

            // Apply repair adjustments if enabled
            let effectiveCumRain = cumRain;
            if (repairConfig.enabled && repairConfig.interval > 0) {
                const lastRepairYear = Math.floor((year - 1) / repairConfig.interval) * repairConfig.interval;
                if (lastRepairYear > 0) {
                    const yearsSinceRepair = year - lastRepairYear;
                    const erosionReduced = cumRain * repairConfig.effectiveness;
                    effectiveCumRain = cumRain - erosionReduced + (yearsSinceRepair * annualRainfall);
                }
            }

            const powerLoss = calculateBladeAveragedPowerLoss(effectiveCumRain, config.P, actualLepLength, baseP, params);
            const aepLoss = powerToAEPLoss(powerLoss, meanWindSpeed);
            const totalPenalty = penaltyPerM * actualLepLength;
            return aepLoss + totalPenalty;
        });

        data[name] = {
            years,
            aepLoss: aepLossOverTime,
            cumulativeAverage: _.mean(aepLossOverTime),
            lepLength: actualLepLength,
            repairSchedule: repairConfig,
            color: LEP_SPECIFICATIONS[name].color
        };
    });

    return data;
}

/**
 * Calculate time to reach IEA levels
 */
export function calculateTimeToIEALevels(aepLossTimeData, ieaLevels) {
    const results = {};

    Object.entries(aepLossTimeData).forEach(([name, data]) => {
        const l2Threshold = ieaLevels[1].value; // L2
        const l5Threshold = ieaLevels[4].value; // L5

        let timeToL2 = null;
        let timeToL5 = null;

        for (let i = 0; i < data.aepLoss.length; i++) {
            const loss = data.aepLoss[i];
            const year = data.years[i];

            if (timeToL2 === null && loss >= l2Threshold) {
                timeToL2 = year;
            }
            if (timeToL5 === null && loss >= l5Threshold) {
                timeToL5 = year;
                break; // L5 is the highest we care about
            }
        }

        results[name] = {
            timeToL2: timeToL2 || '>25', // If never reached, show >25
            timeToL5: timeToL5 || '>25'
        };
    });

    return results;
}

/**
 * Generate chart data for AEP loss per meter at end of lifetime
 * @param {Object} params - Input parameters  
 * @param {Object} calibratedTypes - Calibrated LEP types
 * @returns {Object} Chart data for AEP loss per meter
 */
export function generateAEPLossPerMeterAtEndLife(params, calibratedTypes, lepConfigs) {
    const { lifespan, annualRainfall, meanWindSpeed } = params;
    let cumRainEnd = annualRainfall * lifespan;
    const baseP = calibratedTypes['No LEP'].P;

    const data = {};

    Object.entries(calibratedTypes).forEach(([name, config]) => {
        const lepConfig = lepConfigs[name];
        const actualLepLength = lepConfig.lepLength;
        const penaltyPerM = config.installationPenalty || 0;

        // Apply repair adjustments for end-of-life calculation
        let effectiveCumRain = cumRainEnd;
        if (lepConfig.repairEnabled && lepConfig.repairInterval > 0) {
            const numRepairs = Math.floor(lifespan / lepConfig.repairInterval);
            if (numRepairs > 0) {
                const erosionReduced = cumRainEnd * lepConfig.repairEffectiveness * numRepairs * 0.5; // Conservative estimate
                effectiveCumRain = Math.max(cumRainEnd - erosionReduced, cumRainEnd * 0.3); // Minimum 30% of original
            }
        }

        const { positions, contributions } = calculateAEPLossPerMeter(
            effectiveCumRain, config.P, actualLepLength, baseP, meanWindSpeed, penaltyPerM, params
        );

        data[name] = {
            positions,
            contributions,
            lepLength: actualLepLength,
            maxContribution: Math.max(...contributions),
            lepCoveragePercent: actualLepLength > 0 ? (actualLepLength / params.bladeLength * 100) : 0
        };
    });

    return data;
}

/**
 * Get IEA reference lines for AEP loss charts
 * @param {number} meanWindSpeed - Mean wind speed for level calculation
 * @returns {Array} Reference line configurations
 */
export function getIEAReferenceLevels(meanWindSpeed) {
    const [l2, l3, l4] = Object.entries(IEA_AEP_TABLE)
        .reduce((closest, [speed, levels]) => {
            const speedNum = Number(speed);
            return Math.abs(speedNum - meanWindSpeed) < Math.abs(closest[0] - meanWindSpeed)
                ? [speedNum, levels] : closest;
        })[1];

    const l1 = (l2 / 1.5) * 0.5;
    const l5 = (l4 / 3.5) * 5.0;

    return [
        { value: l1, color: 'gray', style: '--', label: 'L1' },
        { value: l2, color: 'gray', style: '--', label: 'L2' },
        { value: l3, color: 'orange', style: '--', label: 'L3 (Repair Rec.)' },
        { value: l4, color: 'gray', style: '--', label: 'L4' },
        { value: l5, color: 'red', style: '--', label: 'L5 (Structural)' }
    ];
}

/**
 * Linear interpolation utility
 * @param {number} x - Input value
 * @param {Array} xPoints - X coordinates
 * @param {Array} yPoints - Y coordinates  
 * @returns {number} Interpolated value
 */
function interpolateLinear(x, xPoints, yPoints) {
    if (x <= xPoints[0]) return yPoints[0];
    if (x >= xPoints[xPoints.length - 1]) return yPoints[yPoints.length - 1];

    for (let i = 0; i < xPoints.length - 1; i++) {
        if (x >= xPoints[i] && x <= xPoints[i + 1]) {
            const ratio = (x - xPoints[i]) / (xPoints[i + 1] - xPoints[i]);
            return yPoints[i] + ratio * (yPoints[i + 1] - yPoints[i]);
        }
    }

    return yPoints[0];
}