const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  parameters: {
    type: Object,
    required: true,
  },
  results: {
    type: Object,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Simulation', SimulationSchema);
