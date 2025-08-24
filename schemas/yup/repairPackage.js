// schemas/yup/repairPackage.js
const Yup = require('yup');

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
    
    // Repair costs organized by category (material, labor, tooling, crane, other)
    costs: Yup.object().shape({
        material: Yup.object().shape({
            perEventEUR: Yup.number().min(0, 'Per-event cost must be at least 0').default(0),
            perDayEUR: Yup.number().min(0, 'Per-day cost must be at least 0').default(0)
        }).default(() => ({ perEventEUR: 0, perDayEUR: 0 })),
        
        labor: Yup.object().shape({
            perEventEUR: Yup.number().min(0, 'Per-event cost must be at least 0').default(0),
            perDayEUR: Yup.number().min(0, 'Per-day cost must be at least 0').default(0)
        }).default(() => ({ perEventEUR: 0, perDayEUR: 0 })),
        
        tooling: Yup.object().shape({
            perEventEUR: Yup.number().min(0, 'Per-event cost must be at least 0').default(0),
            perDayEUR: Yup.number().min(0, 'Per-day cost must be at least 0').default(0)
        }).default(() => ({ perEventEUR: 0, perDayEUR: 0 })),
        
        crane: Yup.object().shape({
            perEventEUR: Yup.number().min(0, 'Per-event cost must be at least 0').default(0),
            perDayEUR: Yup.number().min(0, 'Per-day cost must be at least 0').default(0)
        }).default(() => ({ perEventEUR: 0, perDayEUR: 0 })),
        
        other: Yup.object().shape({
            perEventEUR: Yup.number().min(0, 'Per-event cost must be at least 0').default(0),
            perDayEUR: Yup.number().min(0, 'Per-day cost must be at least 0').default(0)
        }).default(() => ({ perEventEUR: 0, perDayEUR: 0 }))
    }).required('Costs are required').default(() => ({})),
    
    // General repair duration (applies to all repairs of this type)
    baseDurationDays: Yup.number()
        .min(0, 'Base duration must be at least 0')
        .max(365, 'Base duration must not exceed 365')
        .default(1),
    
    // Crane configuration
    crane: Yup.object().shape({
        type: Yup.string()
            .oneOf(CRANE_TYPES, 'Invalid crane type')
            .default('none'),
        
        minimumDays: Yup.number()
            .min(0, 'Minimum crane days must be at least 0')
            .max(365, 'Minimum crane days must not exceed 365')
            .default(0)
    }).required('Crane configuration is required').default(() => ({})),
    
    // Component applicability (which components can use this package)
    appliesTo: Yup.object().shape({
        componentCategories: Yup.array()
            .of(Yup.string())
            .default(() => [])
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