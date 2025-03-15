// backend/models/OEMScope.js
const mongoose = require('mongoose');

// Schema for corrective maintenance major components
const CorrectiveMajorSchema = new mongoose.Schema({
  tooling: { type: Boolean, default: false },
  manpower: { type: Boolean, default: false },
  parts: { type: Boolean, default: false }
});

// Main OEM Scope Schema
const OEMScopeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  preventiveMaintenance: { 
    type: Boolean, 
    default: false 
  },
  bladeInspections: { 
    type: Boolean, 
    default: false 
  },
  blade: { 
    type: Boolean, 
    default: false 
  },
  bladeLEP: {  // Leading Edge Protection
    type: Boolean, 
    default: false 
  },
  remoteMonitoring: { 
    type: Boolean, 
    default: false 
  },
  remoteTechnicalSupport: { 
    type: Boolean, 
    default: false 
  },
  sitePersonnel: { 
    type: String, 
    enum: ['none', 'partial', 'full'], 
    default: 'none' 
  },
  // Site personnel fields
  siteManagement: { 
    type: Boolean, 
    default: false 
  },
  technicianPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
// backend/models/OEMScope.js (continued)
correctiveMinor: { 
    type: Boolean, 
    default: false 
  },
  correctiveMajor: { 
    type: Boolean, 
    default: false 
  },
  correctiveMajorDetails: {
    type: CorrectiveMajorSchema,
    default: () => ({})
  },
  // Blade integrity management
  bladeIntegrityManagement: {
    type: Boolean,
    default: false
  },
  // New independent crane coverage
  craneCoverage: {
    type: Boolean,
    default: false
  },
  // New caps for crane coverage
  craneEventCap: {
    type: Number,
    min: 0,
    default: 0
  },
  craneFinancialCap: {
    type: Number,
    min: 0,
    default: 0
  },
  // New caps for major components
  majorEventCap: {
    type: Number,
    min: 0,
    default: 0
  },
  majorFinancialCap: {
    type: Number,
    min: 0,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save hook to update the 'updatedAt' field and generate name if empty
OEMScopeSchema.pre('save', function(next) {
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
OEMScopeSchema.methods.generateName = function() {
  const parts = [];
  
  if (this.preventiveMaintenance) parts.push('PM');
  if (this.bladeInspections) parts.push('BI');
  if (this.blade) parts.push('BL');
  if (this.bladeLEP) parts.push('LEP');
  if (this.remoteMonitoring) parts.push('RM');
  if (this.remoteTechnicalSupport) parts.push('RTS');
  
  // Site personnel handling
  if (this.siteManagement) parts.push('SM');
  
  if (this.technicianPercent > 0) {
    if (this.technicianPercent === 100) {
      parts.push('FT'); // Full Technicians
    } else {
      parts.push(`T${this.technicianPercent}`); // Technicians with percentage
    }
  }
  
  if (this.correctiveMinor) parts.push('CMin');
  if (this.bladeIntegrityManagement) parts.push('BIM');
  
  // Independent crane coverage
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
  
  // If no parts selected, use a default name
  if (parts.length === 0) {
    return 'Basic-OEM-Scope';
  }
  
  return parts.join('-');
};

module.exports = mongoose.model('OEMScope', OEMScopeSchema);