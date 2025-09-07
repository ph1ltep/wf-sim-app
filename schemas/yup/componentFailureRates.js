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
        type: 'exponential',
        parameters: { lambda: 0.025, value: 0.025 },
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
            type: 'exponential',
            parameters: { lambda: 0.008, value: 0.008 },
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
            type: 'exponential',
            parameters: { lambda: 0.014, value: 0.014 },
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
            type: 'exponential',
            parameters: { lambda: 0.010, value: 0.010 },
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
            type: 'exponential',
            parameters: { lambda: 0.025, value: 0.025 },
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
            type: 'exponential',
            parameters: { lambda: 0.020, value: 0.020 },
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
            type: 'exponential',
            parameters: { lambda: 0.022, value: 0.022 },
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
            type: 'exponential',
            parameters: { lambda: 0.018, value: 0.018 },
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
            type: 'exponential',
            parameters: { lambda: 0.012, value: 0.012 },
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