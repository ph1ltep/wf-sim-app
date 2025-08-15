/**
 * Component Failure Rate Schema - Wind Turbine Major Components
 * Supports 8 default components with extensible architecture
 * Uses existing DistributionTypeSchema for all distribution inputs
 */

const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

// Individual component failure rate and cost configuration
const ComponentFailureRateSchema = Yup.object().shape({
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

// Default component configurations with industry-standard failure rates
const DEFAULT_COMPONENTS = {
    gearbox: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.025, value: 0.025 }, // 2.5% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    generator: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.020, value: 0.020 }, // 2.0% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    mainBearing: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.018, value: 0.018 }, // 1.8% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    powerElectronics: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.022, value: 0.022 }, // 2.2% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    bladeBearings: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.015, value: 0.015 }, // 1.5% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    yawSystem: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.012, value: 0.012 }, // 1.2% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    controlSystem: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.008, value: 0.008 }, // 0.8% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    transformer: {
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.010, value: 0.010 }, // 1.0% annual
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    }
};

// Portfolio-level component failure rate configuration
const ComponentFailureModelingSchema = Yup.object().shape({
    enabled: Yup.boolean().default(false),
    
    // 8 standardized major components
    components: Yup.object().shape({
        gearbox: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.gearbox),
        generator: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.generator),
        mainBearing: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.mainBearing),
        powerElectronics: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.powerElectronics),
        bladeBearings: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.bladeBearings),
        yawSystem: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.yawSystem),
        controlSystem: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.controlSystem),
        transformer: ComponentFailureRateSchema.default(() => DEFAULT_COMPONENTS.transformer)
    }).default(() => DEFAULT_COMPONENTS)
}).default(() => ({ enabled: false, components: DEFAULT_COMPONENTS }));

// Component display metadata
const COMPONENT_METADATA = {
    gearbox: {
        name: 'Gearbox',
        description: 'Main gearbox assembly (geared platforms only)',
        icon: 'setting',
        category: 'drivetrain'
    },
    generator: {
        name: 'Generator',
        description: 'Electrical generator assembly',
        icon: 'thunderbolt',
        category: 'electrical'
    },
    mainBearing: {
        name: 'Main Bearing',
        description: 'Main shaft bearing assembly',
        icon: 'tool',
        category: 'drivetrain'
    },
    powerElectronics: {
        name: 'Power Electronics',
        description: 'Power conversion and control systems',
        icon: 'control',
        category: 'electrical'
    },
    bladeBearings: {
        name: 'Blade Bearings',
        description: 'Blade pitch bearing assemblies',
        icon: 'sync',
        category: 'rotor'
    },
    yawSystem: {
        name: 'Yaw System',
        description: 'Nacelle yaw drives and bearings',
        icon: 'reload',
        category: 'mechanical'
    },
    controlSystem: {
        name: 'Control System',
        description: 'Turbine control and SCADA systems',
        icon: 'dashboard',
        category: 'control'
    },
    transformer: {
        name: 'Transformer',
        description: 'Step-up transformer assembly',
        icon: 'api',
        category: 'electrical'
    }
};

module.exports = {
    ComponentFailureRateSchema,
    ComponentFailureModelingSchema,
    DEFAULT_COMPONENTS,
    COMPONENT_METADATA
};