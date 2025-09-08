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
    
    // Renamed failureRate → distribution for MarketFactors alignment
    distribution: DistributionTypeSchema.default(() => ({
        type: 'weibull',
        parameters: { shape: 2.0, scale: 50, value: 2.5 },
        timeSeriesMode: false,
        metadata: { percentileDirection: 'ascending' }
    })),
    
    // Quantity configuration for reactive calculation
    quantityConfig: Yup.object().shape({
        mode: Yup.string().oneOf(['fixed', 'perTurbine', 'perBlade']).default('perTurbine'),
        value: Yup.number().min(0).default(1)
    }).default(() => ({ mode: 'perTurbine', value: 1 })),
    
    // Computed quantity field with numWTGs reactivity - aligned with calculateComponentQuantities
    quantity: Yup.number().default(0).transform((value, originalValue, context) => {
        const numWTGs = context.parent?.numWTGs || context.options?.context?.numWTGs || 0;
        const componentId = context.parent?.id || originalValue?.id;
        const wtgPlatformType = context.options?.context?.wtgPlatformType || 'geared';
        const quantityConfig = context.parent?.quantityConfig || { mode: 'perTurbine', value: 1 };
        
        // Calculate quantities based on configuration mode
        switch (quantityConfig.mode) {
            case 'fixed':
                return quantityConfig.value;
            case 'perBlade':
                return numWTGs * 3 * quantityConfig.value; // 3 blades per turbine
            case 'perTurbine':
            default:
                // Special case for gearboxes based on platform type
                if (componentId === 'gearboxes') {
                    return wtgPlatformType === 'geared' ? numWTGs * quantityConfig.value : 0;
                }
                return numWTGs * quantityConfig.value; // Standard per turbine calculation
        }
    }),
    
    // Repair package reference (replaces embedded cost structures)
    repairPackageId: Yup.string().required('Repair package ID is required'),
    
    // Cost override toggle
    enableCostOverrides: Yup.boolean().default(false),
    
    // Optional component-specific overrides
    componentCostOverride: DistributionTypeSchema.nullable().default(null),
    escalationOverride: Yup.number().nullable().default(null),
    
    
    // UI management fields
    isDefault: Yup.boolean().default(false),
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
                // Weibull parameters (shape, scale for annual failure rate)
                shape: 2.8, scale: 0.007, value: 0.008,
                // Normal parameters (mean, std for annual failure rate)  
                mean: 0.008, std: 0.002,
                // Exponential parameters (lambda = annual failure rate)
                lambda: 0.008,
                // Lognormal parameters (mu, sigma for log of annual rate)
                mu: -4.83, sigma: 0.3,
                // Beta parameters (alpha, beta for rate between 0-1)
                alpha: 2.1, beta: 260,
                // Gamma parameters (shape, rate for annual failure rate)
                shapeGamma: 4.0, rate: 500
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        quantityConfig: { mode: 'perBlade', value: 1 },
        quantity: 3, // 3 per turbine
        repairPackageId: 'Heavy Lift Major',
        enableCostOverrides: false,
        componentCostOverride: null,
        escalationOverride: null,
        isDefault: true,
        isLocked: true,
        displayOrder: 1
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
                // Weibull parameters
                shape: 1.8, scale: 0.012, value: 0.014,
                // Normal parameters
                mean: 0.014, std: 0.004,
                // Exponential parameters
                lambda: 0.014,
                // Lognormal parameters  
                mu: -4.27, sigma: 0.35,
                // Beta parameters
                alpha: 3.5, beta: 246,
                // Gamma parameters
                shapeGamma: 3.5, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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
                // Weibull parameters
                shape: 1.2, scale: 0.009, value: 0.010,
                // Normal parameters
                mean: 0.010, std: 0.003,
                // Exponential parameters
                lambda: 0.010,
                // Lognormal parameters
                mu: -4.61, sigma: 0.3,
                // Beta parameters
                alpha: 2.5, beta: 247.5,
                // Gamma parameters
                shapeGamma: 2.5, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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
                // Weibull parameters
                shape: 2.2, scale: 0.020, value: 0.025,
                // Normal parameters
                mean: 0.025, std: 0.008,
                // Exponential parameters
                lambda: 0.025,
                // Lognormal parameters
                mu: -3.69, sigma: 0.32,
                // Beta parameters
                alpha: 6.25, beta: 243.75,
                // Gamma parameters
                shapeGamma: 6.25, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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
                // Weibull parameters
                shape: 2.0, scale: 0.017, value: 0.020,
                // Normal parameters
                mean: 0.020, std: 0.006,
                // Exponential parameters
                lambda: 0.020,
                // Lognormal parameters
                mu: -3.91, sigma: 0.3,
                // Beta parameters
                alpha: 5.0, beta: 245,
                // Gamma parameters
                shapeGamma: 5.0, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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
                // Weibull parameters
                shape: 1.5, scale: 0.019, value: 0.022,
                // Normal parameters
                mean: 0.022, std: 0.007,
                // Exponential parameters
                lambda: 0.022,
                // Lognormal parameters
                mu: -3.82, sigma: 0.32,
                // Beta parameters
                alpha: 5.5, beta: 244.5,
                // Gamma parameters
                shapeGamma: 5.5, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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
                // Weibull parameters
                shape: 1.9, scale: 0.015, value: 0.018,
                // Normal parameters
                mean: 0.018, std: 0.005,
                // Exponential parameters
                lambda: 0.018,
                // Lognormal parameters
                mu: -4.02, sigma: 0.28,
                // Beta parameters
                alpha: 4.5, beta: 245.5,
                // Gamma parameters
                shapeGamma: 4.5, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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
                // Weibull parameters
                shape: 1.6, scale: 0.011, value: 0.012,
                // Normal parameters
                mean: 0.012, std: 0.003,
                // Exponential parameters
                lambda: 0.012,
                // Lognormal parameters
                mu: -4.42, sigma: 0.25,
                // Beta parameters
                alpha: 3.0, beta: 247,
                // Gamma parameters
                shapeGamma: 3.0, rate: 250
            },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
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