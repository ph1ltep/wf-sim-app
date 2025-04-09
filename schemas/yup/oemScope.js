// schemas/yup/oemScope.js
const Yup = require('yup');

// Schema for corrective maintenance major components
const CorrectiveMajorSchema = Yup.object().shape({
    tooling: Yup.boolean().default(false),
    manpower: Yup.boolean().default(false),
    parts: Yup.boolean().default(false),
});

// Main OEM Scope Schema
const OEMScopeSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .trim(),
    isDefault: Yup.boolean()
        .default(false),
    preventiveMaintenance: Yup.boolean()
        .default(false),
    bladeInspections: Yup.boolean()
        .default(false),
    blade: Yup.boolean()
        .default(false),
    bladeLEP: Yup.boolean()
        .default(false),
    remoteMonitoring: Yup.boolean()
        .default(false),
    remoteTechnicalSupport: Yup.boolean()
        .default(false),
    sitePersonnel: Yup.string()
        .oneOf(['none', 'partial', 'full'], 'Invalid site personnel value')
        .default('none'),
    siteManagement: Yup.boolean()
        .default(false),
    technicianPercent: Yup.number()
        .min(0, 'Technician percent must be at least 0')
        .max(100, 'Technician percent must not exceed 100')
        .default(100),
    correctiveMinor: Yup.boolean()
        .default(false),
    correctiveMajor: Yup.boolean()
        .default(false),
    correctiveMajorDetails: CorrectiveMajorSchema
        .default(() => ({})),
    bladeIntegrityManagement: Yup.boolean()
        .default(false),
    craneCoverage: Yup.boolean()
        .default(false),
    craneEventCap: Yup.number()
        .min(0, 'Crane event cap must be at least 0')
        .default(0),
    craneFinancialCap: Yup.number()
        .min(0, 'Crane financial cap must be at least 0')
        .default(0),
    majorEventCap: Yup.number()
        .min(0, 'Major event cap must be at least 0')
        .default(0),
    majorFinancialCap: Yup.number()
        .min(0, 'Major financial cap must be at least 0')
        .default(0),
    createdAt: Yup.date()
        .default(() => new Date()),
    updatedAt: Yup.date()
        .default(() => new Date()),
});

module.exports = OEMScopeSchema;