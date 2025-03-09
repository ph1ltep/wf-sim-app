// backend/models/Simulation.js
const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parameters: { type: mongoose.Schema.Types.Mixed, required: true },
  results: {
    averageIRR: Number,
    irrPercentiles: { p10: Number, p50: Number, p90: Number },
    averageCashFlow: [Number],
    averageDSCR: [Number],
    minDSCRDist: { mean: Number, p5: Number, probBelow1: Number },
    avgCostBreakdown: {
      routineOM: Number,
      majorRepairs: Number,
      insurancePremiums: Number,
      other: Number
    },
    averagePayback: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Simulation', SimulationSchema);