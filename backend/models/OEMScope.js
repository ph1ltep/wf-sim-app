// backend/models/OEMScope.js
const mongoose = require('mongoose');

// Schema for corrective maintenance major components
const CorrectiveMajorSchema = new mongoose.Schema({
  crane: { type: Boolean, default: false },
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
  
  if (this.sitePersonnel === 'full') parts.push('FSP');
  else if (this.sitePersonnel === 'partial') parts.push('PSP');
  
  if (this.correctiveMinor) parts.push('CMin');
  
  if (this.correctiveMajor) {
    const majorParts = [];
    if (this.correctiveMajorDetails.crane) majorParts.push('C');
    if (this.correctiveMajorDetails.tooling) majorParts.push('T');
    if (this.correctiveMajorDetails.manpower) majorParts.push('M');
    if (this.correctiveMajorDetails.parts) majorParts.push('P');
    
    if (majorParts.length > 0) {
      parts.push(`CMaj(${majorParts.join('')})`);
    } else {
      parts.push('CMaj');
    }
  }
  
  // If no parts selected, use a default name
  if (parts.length === 0) {
    return 'Basic-OEM-Scope';
  }
  
  return parts.join('-');
};

module.exports = mongoose.model('OEMScope', OEMScopeSchema);