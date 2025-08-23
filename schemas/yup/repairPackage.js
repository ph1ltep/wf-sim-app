// schemas/yup/repairPackage.js
const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

// Predefined repair package categories
const REPAIR_PACKAGE_CATEGORIES = [
    'major',        // Heavy lift, major components (gearbox, generator)
    'medium',       // Medium complexity (power electronics, transformer)
    'minor',        // Light mechanical (yaw, pitch systems)
    'electronic',   // No crane electronic (control systems, sensors)
    'blade'         // Blade work package (blade bearings, repairs)
];

// Predefined crane types
const CRANE_TYPES = [
    'none',         // No crane required
    'mobile',       // Mobile crane
    'crawler',      // Crawler crane (heavy lift)
    'tower',        // Tower crane (blade work)
    'special'       // Special equipment (custom/unusual)
];

const RepairPackageSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .trim()
        .max(100, 'Name must not exceed 100 characters'),
    
    description: Yup.string()
        .required('Description is required')
        .trim()
        .max(500, 'Description must not exceed 500 characters'),
    
    category: Yup.string()
        .oneOf(REPAIR_PACKAGE_CATEGORIES, 'Invalid repair package category')
        .required('Category is required'),
    
    // Base costs in EUR (the "1.0" values before uncertainty)
    costs: Yup.object().shape({
        componentCostEUR: Yup.number()
            .min(0, 'Component cost must be at least 0')
            .required('Component cost is required')
            .default(0),
        
        craneMobilizationEUR: Yup.number()
            .min(0, 'Crane mobilization cost must be at least 0')
            .default(0),
        
        craneDailyRateEUR: Yup.number()
            .min(0, 'Crane daily rate must be at least 0')
            .default(0),
        
        specialistLaborEUR: Yup.number()
            .min(0, 'Specialist labor cost must be at least 0')
            .default(0)
    }).required('Costs are required').default(() => ({})),
    
    // Crane configuration
    crane: Yup.object().shape({
        required: Yup.boolean()
            .default(false),
        
        type: Yup.string()
            .oneOf(CRANE_TYPES, 'Invalid crane type')
            .default('none'),
        
        minimumDays: Yup.number()
            .min(0, 'Minimum crane days must be at least 0')
            .max(365, 'Minimum crane days must not exceed 365')
            .default(0),
        
        baseDurationDays: Yup.number()
            .min(0, 'Base duration must be at least 0')
            .max(365, 'Base duration must not exceed 365')
            .default(1)
    }).required('Crane configuration is required').default(() => ({})),
    
    // Component-specific complexity distributions
    complexity: Yup.object().shape({
        component: DistributionTypeSchema
            .required('Component complexity distribution is required'),
        
        repair: DistributionTypeSchema
            .required('Repair complexity distribution is required')
    }).required('Complexity distributions are required'),
    
    // Single escalation rate (can be modified by global escalation distribution)
    baseEscalationRate: Yup.number()
        .min(-0.1, 'Base escalation rate must be at least -10%')
        .max(0.2, 'Base escalation rate must not exceed 20%')
        .default(0.03), // 3% annual
    
    // Optional: Override global distributions only when needed
    distributionOverrides: Yup.object()
        .default(() => ({})),
    
    // Component applicability (which components can use this package)
    appliesTo: Yup.object().shape({
        componentCategories: Yup.array()
            .of(Yup.string())
            .default(() => []),
        
        turbineTypes: Yup.array()
            .of(Yup.string())
            .default(() => []),
        
        powerRangeKW: Yup.object().shape({
            min: Yup.number().min(0).default(0),
            max: Yup.number().min(0).default(999999)
        }).default(() => ({ min: 0, max: 999999 }))
    }).default(() => ({})),
    
    // Metadata
    metadata: Yup.object().shape({
        dataSource: Yup.string().trim().default(''),
        confidenceLevel: Yup.string()
            .oneOf(['high', 'medium', 'low'], 'Invalid confidence level')
            .default('medium'),
        lastReviewed: Yup.date().default(() => new Date()),
        reviewedBy: Yup.string().trim().default('')
    }).default(() => ({})),
    
    // Standard timestamps
    createdAt: Yup.date()
        .default(() => new Date()),
    
    updatedAt: Yup.date()
        .default(() => new Date()),
    
    // System flags
    isDefault: Yup.boolean()
        .default(false),
    
    isActive: Yup.boolean()
        .default(true)
});

// Export schema and constants for reuse
module.exports = {
    RepairPackageSchema,
    REPAIR_PACKAGE_CATEGORIES,
    CRANE_TYPES
};