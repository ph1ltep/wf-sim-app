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
    tipSpeed: 85.0,
    bladeLength: 63.0,
    velocityExponent: 7.5,
    annualRainfall: 1200.0,
    meanWindSpeed: 7.5,
    calibrationRainfall: 1200.0,
    lepLength: 26.0,
    repairEnabled: false,
    repairInterval: 10,
    repairEffectiveness: 0.8,
    _referenceSpeed: 80.0
};

// ========================================
// CORE PHYSICS FUNCTIONS (LU-1, LU-2, LU-3)
// ========================================

/**
 * CORE PHYSICS: Generate LEP time series data for a single LEP type
 * @param {Array} rainfallData - DataPointSchema array [{year, value}] for rainfall (mm/year)
 * @param {Array} windData - DataPointSchema array [{year, value}] for wind speed (m/s)  
 * @param {Object} bladeConfig - Complete project.equipment.blades configuration object (with lepType set)
 * @returns {Array} DataPointSchema array [{year, value}] for AEP loss percentage
 */
export function generateLEPTimeSeries(rainfallData, windData, bladeConfig) {
    if (!rainfallData?.length || !windData?.length || !bladeConfig) return [];

    const { nominalTipSpeed: tipSpeed, bladeLength, velocityExponent = 8.0, lepType = 'No LEP' } = bladeConfig;
    const lepSpec = LEP_SPECIFICATIONS[lepType];

    if (!lepSpec) return [];

    // Build LEP configuration from blade config
    const lepConfig = {
        lepLength: bladeConfig.lepLength || lepSpec.defaultConfig.lepLength,
        repairEnabled: bladeConfig.lepRepairEnabled || false,
        repairInterval: bladeConfig.lepRepairInterval || lepSpec.defaultConfig.repairInterval,
        repairEffectiveness: (bladeConfig.lepRepairEffectiveness || lepSpec.defaultConfig.repairEffectiveness * 100) / 100
    };

    // Calibrate LEP type
    const calibratedTypes = calibrateLEPTypes({
        tipSpeed, bladeLength, velocityExponent,
        _referenceSpeed: DEFAULT_PARAMETERS._referenceSpeed,
        overrideInstallationPenalty: bladeConfig.lepInPowerCurve ? 0 : undefined
    });

    const config = calibratedTypes[lepType];
    const baseP = calibratedTypes['No LEP'].P;

    // Create year-aligned data arrays
    const years = rainfallData.map(d => d.year).sort((a, b) => a - b);
    const result = [];

    let cumulativeRain = 0;

    years.forEach(year => {
        // Get rainfall and wind speed for this year
        const rainfallPoint = rainfallData.find(d => d.year === year);
        const windPoint = windData.find(d => d.year === year);

        if (!rainfallPoint || !windPoint) return;

        cumulativeRain += rainfallPoint.value;

        // Apply repair adjustments if enabled
        let effectiveCumRain = cumulativeRain;
        if (lepConfig.repairEnabled && lepConfig.repairInterval > 0) {
            const lastRepairYear = Math.floor((year - 1) / lepConfig.repairInterval) * lepConfig.repairInterval;
            if (lastRepairYear > 0) {
                const yearsSinceRepair = year - lastRepairYear;
                const erosionReduced = cumulativeRain * lepConfig.repairEffectiveness;
                effectiveCumRain = cumulativeRain - erosionReduced + (yearsSinceRepair * rainfallPoint.value);
            }
        }

        // Calculate AEP loss for this year
        const powerLoss = calculateBladeAveragedPowerLoss(
            effectiveCumRain,
            config.P,
            lepConfig.lepLength,
            baseP,
            { tipSpeed, bladeLength, velocityExponent, _referenceSpeed: DEFAULT_PARAMETERS._referenceSpeed }
        );
        const aepLoss = powerToAEPLoss(powerLoss, windPoint.value);
        const totalPenalty = (config.installationPenalty || 0) * lepConfig.lepLength;

        result.push({
            year,
            value: aepLoss + totalPenalty
        });
    });

    return result;
}

/**
 * CORE PHYSICS: Generate LEP spatial analysis data (for visualization only)
 * @param {Array} rainfallData - DataPointSchema array for rainfall  
 * @param {Array} windData - DataPointSchema array for wind speed
 * @param {Object} bladeConfig - Complete project.equipment.blades configuration object
 * @returns {Object} Spatial analysis data for end-of-life visualization
 */
export function generateLEPSpatialAnalysis(rainfallData, windData, bladeConfig) {
    if (!rainfallData?.length || !windData?.length || !bladeConfig) return {};

    // Use end-of-life values (cumulative rainfall, average wind speed)
    const totalRainfall = rainfallData.reduce((sum, d) => sum + d.value, 0);
    const avgWindSpeed = windData.reduce((sum, d) => sum + d.value, 0) / windData.length;

    const { nominalTipSpeed: tipSpeed, bladeLength, velocityExponent = 8.0, lepType = 'No LEP' } = bladeConfig;
    const lepSpec = LEP_SPECIFICATIONS[lepType];

    if (!lepSpec) return {};

    // Build LEP configuration from blade config
    const lepConfig = {
        lepLength: bladeConfig.lepLength || lepSpec.defaultConfig.lepLength,
        repairEnabled: bladeConfig.lepRepairEnabled || false,
        repairInterval: bladeConfig.lepRepairInterval || lepSpec.defaultConfig.repairInterval,
        repairEffectiveness: (bladeConfig.lepRepairEffectiveness || lepSpec.defaultConfig.repairEffectiveness * 100) / 100
    };

    // Calibrate LEP type using blade config parameters
    const calibratedTypes = calibrateLEPTypes({
        tipSpeed, bladeLength, velocityExponent,
        _referenceSpeed: DEFAULT_PARAMETERS._referenceSpeed,
        overrideInstallationPenalty: bladeConfig.lepInPowerCurve ? 0 : undefined
    });

    const config = calibratedTypes[lepType];
    const baseP = calibratedTypes['No LEP'].P;
    const penaltyPerM = config.installationPenalty || 0;

    // Apply repair adjustments for end-of-life
    let effectiveCumRain = totalRainfall;
    if (lepConfig.repairEnabled && lepConfig.repairInterval > 0) {
        const projectLife = rainfallData.length;
        const numRepairs = Math.floor(projectLife / lepConfig.repairInterval);
        if (numRepairs > 0) {
            const erosionReduced = totalRainfall * lepConfig.repairEffectiveness * numRepairs * 0.5;
            effectiveCumRain = Math.max(totalRainfall - erosionReduced, totalRainfall * 0.3);
        }
    }

    const { positions, contributions } = calculateAEPLossPerMeter(
        effectiveCumRain, config.P, lepConfig.lepLength, baseP, avgWindSpeed, penaltyPerM,
        { tipSpeed, bladeLength, velocityExponent, _referenceSpeed: DEFAULT_PARAMETERS._referenceSpeed }
    );

    return {
        positions,
        contributions,
        lepLength: lepConfig.lepLength,
        maxContribution: Math.max(...contributions),
        lepCoveragePercent: lepConfig.lepLength > 0 ? (lepConfig.lepLength / bladeLength * 100) : 0,
        color: lepSpec.color
    };
}

// ========================================
// LEPSIM COMPATIBILITY LAYER (LS-1, LS-2, LS-3)
// ========================================

/**
 * COMPATIBILITY: Extract simulation inputs from DataPointSchema arrays
 * @param {Array} rainfallData - DataPointSchema array for rainfall
 * @param {Array} windData - DataPointSchema array for wind speed
 * @param {number} percentile - Selected percentile (for backward compatibility)
 * @returns {Object} Rainfall and wind speed values
 */
export function getSimulationInputs(rainfallData, windData, percentile = 50) {
    // For DataPointSchema arrays, we can use average values or specific year
    let rainfall = DEFAULT_PARAMETERS.annualRainfall;
    let windSpeed = DEFAULT_PARAMETERS.meanWindSpeed;

    if (rainfallData?.length > 0) {
        // Use average annual rainfall from the dataset
        rainfall = rainfallData.reduce((sum, d) => sum + d.value, 0) / rainfallData.length;
    }

    if (windData?.length > 0) {
        // Use average wind speed from the dataset
        windSpeed = windData.reduce((sum, d) => sum + d.value, 0) / windData.length;
    }

    return { rainfall, windSpeed };
}

/**
 * COMPATIBILITY: Generate time series data for ALL LEP types (for chart visualization)
 * @param {Object} params - Input parameters
 * @param {Object} calibratedTypes - Calibrated LEP types
 * @param {Object} bladeConfig - Base blade configuration object
 * @returns {Object} Chart data for AEP loss over time FOR ALL LEP TYPES
 */
export function generateAEPLossOverTime(params, calibratedTypes, bladeConfig) {
    const { lifespan, annualRainfall, meanWindSpeed } = params;

    // Create synthetic DataPointSchema arrays for compatibility
    const rainfallData = [];
    const windData = [];

    for (let year = 1; year <= Math.floor(lifespan); year++) {
        rainfallData.push({ year, value: annualRainfall });
        windData.push({ year, value: meanWindSpeed });
    }

    const data = {};

    // Generate data for ALL LEP types by creating modified blade configs
    Object.entries(LEP_SPECIFICATIONS).forEach(([lepType, lepSpec]) => {
        // Create blade config for this specific LEP type
        const lepTypeBladeConfig = {
            ...bladeConfig,
            lepType: lepType,
            // Use current settings if this is the selected type, otherwise use defaults
            lepLength: lepType === bladeConfig.lepType ?
                (bladeConfig.lepLength || lepSpec.defaultConfig.lepLength) :
                lepSpec.defaultConfig.lepLength,
            lepRepairEnabled: lepType === bladeConfig.lepType ?
                (bladeConfig.lepRepairEnabled || false) :
                lepSpec.defaultConfig.repairEffectiveness > 0,
            lepRepairInterval: lepType === bladeConfig.lepType ?
                (bladeConfig.lepRepairInterval || lepSpec.defaultConfig.repairInterval) :
                lepSpec.defaultConfig.repairInterval,
            lepRepairEffectiveness: lepType === bladeConfig.lepType ?
                (bladeConfig.lepRepairEffectiveness || lepSpec.defaultConfig.repairEffectiveness * 100) :
                lepSpec.defaultConfig.repairEffectiveness * 100
        };

        // Use core physics function
        const coreResult = generateLEPTimeSeries(rainfallData, windData, lepTypeBladeConfig);

        // Extract years and values
        const years = coreResult.map(d => d.year);
        const aepLoss = coreResult.map(d => d.value);

        // Create interpolated data for smooth charting (more points)
        const interpolatedYears = [];
        const interpolatedAepLoss = [];

        if (years.length >= 2) {
            const totalYears = Math.floor(lifespan);
            for (let t = 1; t <= totalYears; t += 0.1) { // 0.1 year intervals for smooth curves
                interpolatedYears.push(t);
                interpolatedAepLoss.push(interpolateLinear(t, years, aepLoss));
            }
        } else {
            interpolatedYears.push(...years);
            interpolatedAepLoss.push(...aepLoss);
        }

        data[lepType] = {
            years: interpolatedYears,
            aepLoss: interpolatedAepLoss,
            cumulativeAverage: _.mean(aepLoss),
            lepLength: lepTypeBladeConfig.lepLength,
            repairSchedule: {
                enabled: lepTypeBladeConfig.lepRepairEnabled,
                interval: lepTypeBladeConfig.lepRepairInterval,
                effectiveness: lepTypeBladeConfig.lepRepairEffectiveness / 100
            },
            color: lepSpec.color
        };
    });

    return data;
}

/**
 * COMPATIBILITY: Generate chart data for AEP loss per meter at end of lifetime FOR ALL LEP TYPES
 * @param {Object} params - Input parameters  
 * @param {Object} calibratedTypes - Calibrated LEP types
 * @param {Object} bladeConfig - Base blade configuration object
 * @returns {Object} Chart data for AEP loss per meter FOR ALL LEP TYPES
 */
export function generateAEPLossPerMeterAtEndLife(params, calibratedTypes, bladeConfig) {
    const { lifespan, annualRainfall, meanWindSpeed } = params;

    // Create synthetic DataPointSchema arrays for end-of-life analysis
    const rainfallData = [];
    const windData = [];

    for (let year = 1; year <= Math.floor(lifespan); year++) {
        rainfallData.push({ year, value: annualRainfall });
        windData.push({ year, value: meanWindSpeed });
    }

    const data = {};

    // Generate data for ALL LEP types by creating modified blade configs
    Object.entries(LEP_SPECIFICATIONS).forEach(([lepType, lepSpec]) => {
        // Create blade config for this specific LEP type
        const lepTypeBladeConfig = {
            ...bladeConfig,
            lepType: lepType,
            // Use current settings if this is the selected type, otherwise use defaults
            lepLength: lepType === bladeConfig.lepType ?
                (bladeConfig.lepLength || lepSpec.defaultConfig.lepLength) :
                lepSpec.defaultConfig.lepLength,
            lepRepairEnabled: lepType === bladeConfig.lepType ?
                (bladeConfig.lepRepairEnabled || false) :
                lepSpec.defaultConfig.repairEffectiveness > 0,
            lepRepairInterval: lepType === bladeConfig.lepType ?
                (bladeConfig.lepRepairInterval || lepSpec.defaultConfig.repairInterval) :
                lepSpec.defaultConfig.repairInterval,
            lepRepairEffectiveness: lepType === bladeConfig.lepType ?
                (bladeConfig.lepRepairEffectiveness || lepSpec.defaultConfig.repairEffectiveness * 100) :
                lepSpec.defaultConfig.repairEffectiveness * 100
        };

        // Use core spatial analysis function
        const coreResult = generateLEPSpatialAnalysis(rainfallData, windData, lepTypeBladeConfig);

        data[lepType] = coreResult;
    });

    return data;
}

// ========================================
// PRESERVED EXISTING ALGORITHMS (LU-4)
// ========================================

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
    const { _referenceSpeed, velocityExponent, bladeLength, overrideInstallationPenalty } = currentParams;

    const calibratedTypes = {};

    Object.entries(LEP_SPECIFICATIONS).forEach(([name, spec]) => {
        const { P_base, calibration } = spec;

        // Use override if provided, otherwise use spec's installationPenalty
        const installationPenalty = overrideInstallationPenalty !== undefined
            ? overrideInstallationPenalty
            : (spec.installationPenalty || 0);

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
            installationPenalty, // Use the (potentially overridden) installation penalty
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

    // Map power loss to AEP loss using interpolation
    if (powerLoss <= 0) return 0;
    if (powerLoss <= 2) return interpolateLinear(powerLoss, [0, 2], [0, l2]);
    if (powerLoss <= 4) return interpolateLinear(powerLoss, [2, 4], [l2, l3]);
    if (powerLoss <= 6) return interpolateLinear(powerLoss, [4, 6], [l3, l4]);

    // Beyond 6% power loss, extrapolate linearly
    const slopeHigh = (l4 - l3) / 2;
    return l4 + slopeHigh * (powerLoss - 6);
}

/**
 * Calculate blade-averaged power loss
 * @param {number} cumRain - Cumulative rainfall (mm)
 * @param {number} P - Protection factor
 * @param {number} lepLength - LEP length (m)
 * @param {number} baseP - Base protection factor
 * @param {Object} params - Physics parameters
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
 * @returns {Object} Positions and contributions arrays
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
 * Calculate time to reach IEA levels (FIXED to return whole numbers)
 * @param {Object} aepLossTimeData - Time series data from generateAEPLossOverTime
 * @param {Array} ieaLevels - IEA reference levels
 * @returns {Object} Time to reach each level per LEP type
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
            const year = Math.ceil(data.years[i]); // ROUND UP to whole numbers

            if (timeToL2 === null && loss >= l2Threshold) {
                timeToL2 = year;
            }
            if (timeToL5 === null && loss >= l5Threshold) {
                timeToL5 = year;
                break; // L5 is the highest we care about
            }
        }

        results[name] = {
            timeToL2: timeToL2 || '>25',
            timeToL5: timeToL5 || '>25'
        };
    });

    return results;
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