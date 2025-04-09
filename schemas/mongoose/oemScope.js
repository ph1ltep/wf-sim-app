// schemas/mongoose/oemScope.js
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const OEMScopeSchemaYup = require('../yup/oemScope');

// Generate CorrectiveMajorSchema separately
const CorrectiveMajorSchema = yupToMongoose(Yup.object().shape({
    tooling: Yup.boolean().default(false),
    manpower: Yup.boolean().default(false),
    parts: Yup.boolean().default(false),
}));

const OEMScopeSchema = yupToMongoose(OEMScopeSchemaYup, {
    // Overrides for DB-specific features
    name: {
        type: String,
        required: true,
        trim: true
    },
    correctiveMajorDetails: {
        type: CorrectiveMajorSchema,
        default: () => ({})
    },
});

// Pre-save hook to update 'updatedAt' and handle custom logic
OEMScopeSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // If no name is provided, generate one based on scope selections
    if (!this.name || this.name.trim() === '') {
        this.name = this.generateName();
    }

    // Set sitePersonnel based on siteManagement and technicianPercent
    if (this.siteManagement) {
        this.sitePersonnel = this.technicianPercent === 100 ? 'full' : 'partial';
    } else {
        this.sitePersonnel = 'none';
        this.technicianPercent = 0;
    }

    next();
});

// Method to generate a name based on scope selections
OEMScopeSchema.methods.generateName = function () {
    const parts = [];

    if (this.preventiveMaintenance) parts.push('PM');
    if (this.bladeInspections) parts.push('BI');
    if (this.blade) parts.push('BL');
    if (this.bladeLEP) parts.push('LEP');
    if (this.remoteMonitoring) parts.push('RM');
    if (this.remoteTechnicalSupport) parts.push('RTS');

    if (this.siteManagement) parts.push('SM');

    if (this.technicianPercent > 0) {
        if (this.technicianPercent === 100) {
            parts.push('FT');
        } else {
            parts.push(`T${this.technicianPercent}`);
        }
    }

    if (this.correctiveMinor) parts.push('CMin');
    if (this.bladeIntegrityManagement) parts.push('BIM');

    if (this.craneCoverage) {
        let cranePart = 'Crane';
        if (this.craneEventCap > 0 || this.craneFinancialCap > 0) {
            cranePart += 'Cap';
        }
        parts.push(cranePart);
    }

    if (this.correctiveMajor) {
        const majorParts = [];
        if (this.correctiveMajorDetails.tooling) majorParts.push('T');
        if (this.correctiveMajorDetails.manpower) majorParts.push('M');
        if (this.correctiveMajorDetails.parts) majorParts.push('P');

        let majorStr = 'CMaj';
        if (majorParts.length > 0) {
            majorStr += `(${majorParts.join('')})`;
        }

        if (this.majorEventCap > 0 || this.majorFinancialCap > 0) {
            majorStr += 'Cap';
        }

        parts.push(majorStr);
    }

    if (parts.length === 0) {
        return 'Basic-OEM-Scope';
    }

    return parts.join('-');
};

const OEMScope = mongoose.model('OEMScope', OEMScopeSchema);

module.exports = OEMScope;