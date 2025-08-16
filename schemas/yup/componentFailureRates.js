/**
 * Component Failure Rate Schema - Wind Turbine Major Components
 * Supports 8 default components with extensible architecture
 * Uses existing DistributionTypeSchema for all distribution inputs
 */

const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

// Individual component failure rate and cost configuration (for dynamic arrays)
const ComponentFailureRateSchema = Yup.object().shape({
    id: Yup.string().required('Component ID is required'),
    name: Yup.string().required('Component name is required'),
    category: Yup.string().oneOf(['drivetrain', 'electrical', 'rotor', 'mechanical', 'control']).required(),
    enabled: Yup.boolean().default(false),
    
    // Failure rate using existing distribution system - supports all input modes
    failureRate: DistributionTypeSchema.default(() => ({
        type: 'exponential',
        parameters: { lambda: 0.025, value: 0.025 }, // 2.5% annual default
        timeSeriesMode: false,
        timeSeriesParameters: { value: [] },
        metadata: { percentileDirection: 'ascending' }
    })),
    
    // Cost components using existing distribution system
    costs: Yup.object().shape({
        componentReplacement: DistributionTypeSchema.default(() => ({
            type: 'lognormal',
            parameters: { mu: 13.1, sigma: 0.4, value: 500000 }, // $500K default
            metadata: { percentileDirection: 'ascending' }
        })),
        craneMobilization: DistributionTypeSchema.default(() => ({
            type: 'triangular',
            parameters: { min: 80000, mode: 120000, max: 200000, value: 120000 },
            metadata: { percentileDirection: 'ascending' }
        })),
        craneDailyRate: DistributionTypeSchema.default(() => ({
            type: 'normal',
            parameters: { mean: 15000, stdDev: 3000, value: 15000 },
            metadata: { percentileDirection: 'ascending' }
        })),
        repairDurationDays: DistributionTypeSchema.default(() => ({
            type: 'gamma',
            parameters: { shape: 3, scale: 2, value: 6 }, // 6 days average
            metadata: { percentileDirection: 'ascending' }
        })),
        specialistLabor: DistributionTypeSchema.default(() => ({
            type: 'normal',
            parameters: { mean: 35000, stdDev: 10000, value: 35000 },
            metadata: { percentileDirection: 'ascending' }
        })),
        downtimeRevenuePerDay: DistributionTypeSchema.default(() => ({
            type: 'normal',
            parameters: { mean: 200, stdDev: 50, value: 200 }, // $/MWh/day
            metadata: { percentileDirection: 'descending' } // Revenue loss
        }))
    }).default(() => ({}))
}).default(() => ({}));

// Default component configurations as array for EditableTable
const DEFAULT_COMPONENTS = [
    {
        id: 'gearbox',
        name: 'Gearbox',
        category: 'drivetrain',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.025, value: 0.025 }, // 2.5% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'generator',
        name: 'Generator',
        category: 'electrical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.020, value: 0.020 }, // 2.0% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'mainBearing',
        name: 'Main Bearing',
        category: 'drivetrain',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.018, value: 0.018 }, // 1.8% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'powerElectronics',
        name: 'Power Electronics',
        category: 'electrical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.022, value: 0.022 }, // 2.2% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'bladeBearings',
        name: 'Blade Bearings',
        category: 'rotor',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.015, value: 0.015 }, // 1.5% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'yawSystem',
        name: 'Yaw System',
        category: 'mechanical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.012, value: 0.012 }, // 1.2% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'controlSystem',
        name: 'Control System',
        category: 'control',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.008, value: 0.008 }, // 0.8% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'transformer',
        name: 'Transformer',
        category: 'electrical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.010, value: 0.010 }, // 1.0% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    }
];

// Portfolio-level component failure rate configuration (dynamic array structure)
const ComponentFailureModelingSchema = Yup.object().shape({
    enabled: Yup.boolean().default(false),
    
    // Dynamic array of components for EditableTable
    components: Yup.array().of(ComponentFailureRateSchema).default(() => DEFAULT_COMPONENTS)
}).default(() => ({ enabled: false, components: DEFAULT_COMPONENTS }));

// Component display metadata
const COMPONENT_METADATA = {
    gearbox: {
        name: 'Gearbox',
        description: 'Main gearbox assembly (geared platforms only)',
        category: 'drivetrain'
    },
    generator: {
        name: 'Generator',
        description: 'Electrical generator assembly',
        category: 'electrical'
    },
    mainBearing: {
        name: 'Main Bearing',
        description: 'Main shaft bearing assembly',
        category: 'drivetrain'
    },
    powerElectronics: {
        name: 'Power Electronics',
        description: 'Power conversion and control systems',
        category: 'electrical'
    },
    bladeBearings: {
        name: 'Blade Bearings',
        description: 'Blade pitch bearing assemblies',
        category: 'rotor'
    },
    yawSystem: {
        name: 'Yaw System',
        description: 'Nacelle yaw drives and bearings',
        category: 'mechanical'
    },
    controlSystem: {
        name: 'Control System',
        description: 'Turbine control and SCADA systems',
        category: 'control'
    },
    transformer: {
        name: 'Transformer',
        description: 'Step-up transformer assembly',
        category: 'electrical'
    }
};

module.exports = {
    ComponentFailureRateSchema,
    ComponentFailureModelingSchema,
    DEFAULT_COMPONENTS,
    COMPONENT_METADATA
};