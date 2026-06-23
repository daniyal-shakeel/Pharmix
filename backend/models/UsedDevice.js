const mongoose = require('mongoose');

const usedDeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UsedDevice', usedDeviceSchema);
