const mongoose = require('mongoose');

const demoLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  userId: { type: String, required: true },
  route: { type: String, required: true },
  action: { type: String, required: true },
  result: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DemoLog', demoLogSchema);
