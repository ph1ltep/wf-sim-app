// backend/models/Simulation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SimulationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  parameters: {
    type: Schema.Types.Mixed, // flexible JSON object to store all input parameters
    required: true
  },
  results: {
    type: Schema.Types.Mixed, // will store summary outputs and distribution data
    default: {}
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Simulation', SimulationSchema);
