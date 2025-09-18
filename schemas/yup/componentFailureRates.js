/**
 * Component Failure Rate Schema - Object-Based Storage with MarketFactors Alignment
 * Phase 3: Array-to-Object transformation with computed quantities
 * Components stored as object keys for efficient lookup and UI integration
 */

const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

// Individual component failure rate schema with object-based structure
const ComponentFailureRateSchema = Yup.object().shape({
    id: Yup.string().required('Component ID is required'),
    name: Yup.string().required('Component name is required'),
    category: Yup.string().oneOf(['drivetrain', 'electrical', 'rotor', 'mechanical', 'control']).required(),
    enabled: Yup.boolean().default(false),

    distribution: DistributionTypeSchema.default(() => ({ // Renamed failureRate → distribution for MarketFactors alignment
        type: 'weibull',
        parameters: {
            shape: 2.0, scale: 50, value: 2.5,
            // Three-phase Weibull parameters (for physics-based modeling)
            phase1: { shape: 0.6, scale: 2.1 }, // Infant mortality (0-2 years)
            phase2: { shape: 1.0, scale: 25.0 }, // Useful life (2-20 years)
            phase3: { shape: 3.0, scale: 28.0 }, // Wear-out (20-30 years)
            phaseContinuityTolerance: 0.05, // Continuity constraint tolerance
            wearOutMultiplier: 2.5 // Wear-out acceleration factor
        },
        timeSeriesMode: false,
        metadata: { percentileDirection: 'ascending' }
    })),

    quantityConfig: Yup.object().shape({ // Quantity configuration for reactive calculation
        mode: Yup.string().oneOf(['fixed', 'perTurbine', 'perBlade']).default('perTurbine'),
        value: Yup.number().min(0).default(1)
    }).default(() => ({ mode: 'perTurbine', value: 1 })),

    quantity: Yup.number().default(0).transform((value, originalValue, context) => { // Computed quantity field with numWTGs reactivity
        const numWTGs = context.parent?.numWTGs || context.options?.context?.numWTGs || 0;
        const componentId = context.parent?.id || originalValue?.id;
        const wtgPlatformType = context.options?.context?.wtgPlatformType || 'geared';
        const quantityConfig = context.parent?.quantityConfig || { mode: 'perTurbine', value: 1 };

        switch (quantityConfig.mode) { // Calculate quantities based on configuration mode
            case 'fixed': return quantityConfig.value;
            case 'perBlade': return numWTGs * 3 * quantityConfig.value; // 3 blades per turbine
            case 'perTurbine':
            default:
                if (componentId === 'gearboxes') { // Special case for gearboxes based on platform type
                    return wtgPlatformType === 'geared' ? numWTGs * quantityConfig.value : 0;
                }
                return numWTGs * quantityConfig.value; // Standard per turbine calculation
        }
    }),

    // Physics parameters for component-specific calculations (optional - only set for fixed components)
    physicsParameters: Yup.object().optional().default(undefined),

    repairPackageId: Yup.string().required('Repair package ID is required'), // Repair package reference
    enableCostOverrides: Yup.boolean().default(false), // Cost override toggle
    componentCostOverride: DistributionTypeSchema.nullable().default(null), // Optional component-specific overrides
    escalationOverride: Yup.number().nullable().default(null),

    isDefault: Yup.boolean().default(false), // UI management fields
    isLocked: Yup.boolean().default(false), // Prevents deletion of default components
    displayOrder: Yup.number().default(0)
});

// Aligned components with Specifications.jsx calculateComponentQuantities (8 components)
const DEFAULT_COMPONENTS = [
    {
        id: 'blades',
        name: 'Blades',
        category: 'rotor',
        enabled: false,
        distribution: {
            key: 'blades',
            type: 'weibull',
            parameters: {
                shape: 2.8, scale: 0.007, value: 0.008, // Weibull (shape, scale for annual failure rate)
                mean: 0.008, std: 0.002, // Normal (mean, std for annual failure rate)
                lambda: 0.008, // Exponential (annual failure rate)
                mu: -4.83, sigma: 0.3, // Lognormal (mu, sigma for log of annual rate)
                alpha: 2.1, beta: 260, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 4.0, rate: 500, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Blade-specific physics parameters
            fatigueLimitMPa: 100, // Material fatigue limit (MPa)
            surfaceTreatment: 'standard' // Surface treatment type
        },
        quantityConfig: { mode: 'perBlade', value: 1 },
        quantity: 3, repairPackageId: 'Heavy Lift Major', enableCostOverrides: false,
        componentCostOverride: null, escalationOverride: null, isDefault: true, isLocked: true, displayOrder: 1
    },
    {
        id: 'bladeBearings',
        name: 'Blade Bearings',
        category: 'rotor',
        enabled: false,
        distribution: {
            key: 'bladeBearings',
            type: 'weibull',
            parameters: {
                shape: 1.8, scale: 0.012, value: 0.014, // Weibull (shape, scale for annual failure rate)
                mean: 0.014, std: 0.004, // Normal (mean, std for annual failure rate)
                lambda: 0.014, // Exponential (annual failure rate)
                mu: -4.27, sigma: 0.35, // Lognormal (mu, sigma for log of annual rate)
                alpha: 3.5, beta: 246, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 3.5, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Blade bearing-specific physics parameters
            bearingDiameterMM: 2500, // Pitch bearing diameter (mm)
            raceHardnessHRC: 58, // Bearing race hardness (HRC)
            sealingType: 'labyrinth' // Bearing sealing mechanism
        },
        quantityConfig: { mode: 'perBlade', value: 1 },
        quantity: 3, // 3 per turbine
        repairPackageId: 'Light Mechanical',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 2
    },
    {
        id: 'transformers',
        name: 'Transformers',
        category: 'electrical',
        enabled: false,
        distribution: {
            key: 'transformers',
            type: 'weibull',
            parameters: {
                shape: 1.2, scale: 0.009, value: 0.010, // Weibull (shape, scale for annual failure rate)
                mean: 0.010, std: 0.003, // Normal (mean, std for annual failure rate)
                lambda: 0.010, // Exponential (annual failure rate)
                mu: -4.61, sigma: 0.3, // Lognormal (mu, sigma for log of annual rate)
                alpha: 2.5, beta: 247.5, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 2.5, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Transformer-specific physics parameters
            voltageRatingkV: 34.5, // Transformer voltage rating (kV)
            insulationClass: 'H', // Insulation temperature class
            coolingMethod: 'ONAN' // Oil natural air natural cooling
        },
        quantityConfig: { mode: 'perTurbine', value: 1 },
        quantity: 1, // 1 per turbine
        repairPackageId: 'Medium Lift Electrical',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 3
    },
    {
        id: 'gearboxes',
        name: 'Gearboxes',
        category: 'drivetrain',
        enabled: false,
        distribution: {
            key: 'gearboxes',
            type: 'weibull',
            parameters: {
                shape: 2.2, scale: 0.020, value: 0.025, // Weibull (shape, scale for annual failure rate)
                mean: 0.025, std: 0.008, // Normal (mean, std for annual failure rate)
                lambda: 0.025, // Exponential (annual failure rate)
                mu: -3.69, sigma: 0.32, // Lognormal (mu, sigma for log of annual rate)
                alpha: 6.25, beta: 243.75, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 6.25, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Gearbox-specific physics parameters
            bearingL10Hours: 175000, // Bearing L10 life specification (hours)
            gearStages: 3, // Number of gear stages
            oilViscosityISO: 320 // Oil viscosity grade (ISO VG)
        },
        quantityConfig: { mode: 'perTurbine', value: 1 },
        quantity: 1, // 1 per turbine (geared only)
        repairPackageId: 'Heavy Lift Major',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 4
    },
    {
        id: 'generators',
        name: 'Generators',
        category: 'electrical',
        enabled: false,
        distribution: {
            key: 'generators',
            type: 'weibull',
            parameters: {
                shape: 2.0, scale: 0.017, value: 0.020, // Weibull (shape, scale for annual failure rate)
                mean: 0.020, std: 0.006, // Normal (mean, std for annual failure rate)
                lambda: 0.020, // Exponential (annual failure rate)
                mu: -3.91, sigma: 0.3, // Lognormal (mu, sigma for log of annual rate)
                alpha: 5.0, beta: 245, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 5.0, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Generator-specific physics parameters
            ratedPowerMW: 3.0, // Rated electrical power output (MW)
            windingClass: 'F', // Insulation temperature class
            coolingMethod: 'air' // Cooling system type
        },
        quantityConfig: { mode: 'perTurbine', value: 1 },
        quantity: 1, // 1 per turbine
        repairPackageId: 'Heavy Lift Major',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 5
    },
    {
        id: 'converters',
        name: 'Converters',
        category: 'electrical',
        enabled: false,
        distribution: {
            key: 'converters',
            type: 'weibull',
            parameters: {
                shape: 1.5, scale: 0.019, value: 0.022, // Weibull (shape, scale for annual failure rate)
                mean: 0.022, std: 0.007, // Normal (mean, std for annual failure rate)
                lambda: 0.022, // Exponential (annual failure rate)
                mu: -3.82, sigma: 0.32, // Lognormal (mu, sigma for log of annual rate)
                alpha: 5.5, beta: 244.5, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 5.5, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Converter-specific physics parameters
            switchingFrequencyHz: 2000, // Power electronics switching frequency (Hz)
            thermalDesignPowerW: 150000, // Thermal design power (W)
            coolingType: 'liquid' // Cooling system type
        },
        quantityConfig: { mode: 'perTurbine', value: 1 },
        quantity: 1, // 1 per turbine
        repairPackageId: 'Medium Lift Electrical',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 6
    },
    {
        id: 'mainBearings',
        name: 'Main Bearings',
        category: 'drivetrain',
        enabled: false,
        distribution: {
            key: 'mainBearings',
            type: 'weibull',
            parameters: {
                shape: 1.9, scale: 0.015, value: 0.018, // Weibull (shape, scale for annual failure rate)
                mean: 0.018, std: 0.005, // Normal (mean, std for annual failure rate)
                lambda: 0.018, // Exponential (annual failure rate)
                mu: -4.02, sigma: 0.28, // Lognormal (mu, sigma for log of annual rate)
                alpha: 4.5, beta: 245.5, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 4.5, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Main bearing-specific physics parameters
            bearingTypeSKF: 'TRB', // Tapered roller bearing type
            dynamicLoadRatingkN: 2650, // Dynamic load rating (kN)
            greaseLubricationType: 'lithium' // Lubrication grease type
        },
        quantityConfig: { mode: 'perTurbine', value: 1 },
        quantity: 1, // 1 per turbine
        repairPackageId: 'Heavy Lift Major',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 7
    },
    {
        id: 'yawSystems',
        name: 'Yaw Systems',
        category: 'mechanical',
        enabled: false,
        distribution: {
            key: 'yawSystems',
            type: 'weibull',
            parameters: {
                shape: 1.6, scale: 0.011, value: 0.012, // Weibull (shape, scale for annual failure rate)
                mean: 0.012, std: 0.003, // Normal (mean, std for annual failure rate)
                lambda: 0.012, // Exponential (annual failure rate)
                mu: -4.42, sigma: 0.25, // Lognormal (mu, sigma for log of annual rate)
                alpha: 3.0, beta: 247, // Beta (alpha, beta for rate between 0-1)
                shapeGamma: 3.0, rate: 250, // Gamma (shape, rate for annual failure rate)
                phase1: { shape: 0.6, scale: 2.1 }, phase2: { shape: 1.0, scale: 25.0 }, phase3: { shape: 3.0, scale: 28.0 }, // Three-phase Weibull
                phaseContinuityTolerance: 0.05, wearOutMultiplier: 2.5 // Physics constraints
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        physicsParameters: { // Yaw system-specific physics parameters
            yawMotorCount: 4, // Number of yaw drive motors
            gearReductionRatio: 2000, // Yaw drive gear reduction ratio
            yawBrakeType: 'hydraulic' // Yaw brake system type
        },
        quantityConfig: { mode: 'perTurbine', value: 1 },
        quantity: 1, // 1 per turbine
        repairPackageId: 'Light Mechanical',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 8
    }
];

// Object-based default components following MarketFactors pattern
const DEFAULT_COMPONENTS_OBJECT = DEFAULT_COMPONENTS.reduce((acc, component) => {
    acc[component.id] = component;
    return acc;
}, {});

// Portfolio-level component failure rate configuration with object-based storage
const ComponentFailureModelingSchema = Yup.object().shape({
    enabled: Yup.boolean().default(false),
    // Object-based components storage following MarketFactors pattern
    components: Yup.mixed().default(() => DEFAULT_COMPONENTS_OBJECT),
    // Backward compatibility transform for array-to-object migration
    __migrationTransform: Yup.mixed().transform((value, originalValue) => {
        // Handle legacy array format by converting to object
        if (Array.isArray(originalValue?.components)) {
            const componentsObject = originalValue.components.reduce((acc, component) => {
                acc[component.id] = component;
                return acc;
            }, {});
            return {
                ...originalValue,
                components: componentsObject
            };
        }
        return originalValue;
    })
}).default(() => ({ 
    enabled: false, 
    components: DEFAULT_COMPONENTS_OBJECT
}));

module.exports = {
    ComponentFailureRateSchema,
    ComponentFailureModelingSchema,
    DEFAULT_COMPONENTS,
    DEFAULT_COMPONENTS_OBJECT
};