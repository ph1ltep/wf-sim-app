/**
 * Component Failure Rate Schema - Simplified Design with Repair Package References
 * Phase 2B: Reduced from 482 lines to ~100 lines (79% reduction)
 * Components reference repair packages instead of embedding cost structures
 */

const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

// Simplified component failure rate configuration
const ComponentFailureRateSchema = Yup.object().shape({
    id: Yup.string().required('Component ID is required'),
    name: Yup.string().required('Component name is required'),
    category: Yup.string().oneOf(['drivetrain', 'electrical', 'rotor', 'mechanical', 'control']).required(),
    enabled: Yup.boolean().default(false),
    
    // Failure rate using existing distribution system
    failureRate: DistributionTypeSchema.default(() => ({
        type: 'exponential',
        parameters: { lambda: 0.025, value: 0.025 },
        timeSeriesMode: false,
        metadata: { percentileDirection: 'ascending' }
    })),
    
    // Repair package reference (replaces embedded cost structures)
    repairPackageId: Yup.string().required('Repair package ID is required'),
    
    // Optional component-specific overrides
    componentCostOverride: DistributionTypeSchema.nullable().default(null),
    escalationOverride: Yup.number().nullable().default(null)
});

// Simplified default components referencing repair packages
const DEFAULT_COMPONENTS = [
    {
        id: 'gearbox',
        name: 'Gearbox',
        category: 'drivetrain',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.025, value: 0.025 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Heavy Lift Major',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'generator',
        name: 'Generator',
        category: 'electrical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.020, value: 0.020 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Heavy Lift Major',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'mainBearing',
        name: 'Main Bearing',
        category: 'drivetrain',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.018, value: 0.018 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Heavy Lift Major',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'powerElectronics',
        name: 'Power Electronics',
        category: 'electrical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.022, value: 0.022 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Medium Lift Electrical',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'transformer',
        name: 'Transformer',
        category: 'electrical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.010, value: 0.010 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Medium Lift Electrical',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'yawSystem',
        name: 'Yaw System',
        category: 'mechanical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.012, value: 0.012 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Light Mechanical',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'pitchSystem',
        name: 'Pitch System',
        category: 'mechanical',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.015, value: 0.015 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'Light Mechanical',
        componentCostOverride: null,
        escalationOverride: null
    },
    {
        id: 'controlSystem',
        name: 'Control System',
        category: 'control',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.008, value: 0.008 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        },
        repairPackageId: 'No Crane Electronic',
        componentCostOverride: null,
        escalationOverride: null
    }
];

// Portfolio-level component failure rate configuration
const ComponentFailureModelingSchema = Yup.object().shape({
    enabled: Yup.boolean().default(false),
    components: Yup.array().of(ComponentFailureRateSchema).default(() => DEFAULT_COMPONENTS)
}).default(() => ({ enabled: false, components: DEFAULT_COMPONENTS }));

module.exports = {
    ComponentFailureRateSchema,
    ComponentFailureModelingSchema,
    DEFAULT_COMPONENTS
};