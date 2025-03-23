// backend/models/MajorComponent.js
const mongoose = require('mongoose');

const MajorComponentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  appliesTo: {
    geared: { 
      type: Boolean, 
      default: true 
    },
    directDrive: { 
      type: Boolean, 
      default: true 
    }
  },
  quantityPerWTG: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  defaultFailureRate: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.01
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

// Pre-save hook to update the 'updatedAt' field
MajorComponentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Export both the model and the schema
module.exports = {
    MajorComponent: mongoose.model('MajorComponent', MajorComponentSchema),
    MajorComponentSchema
  };