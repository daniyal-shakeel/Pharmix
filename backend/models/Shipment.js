const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  manufacturerId: { type: String, required: true },
  pharmacyId: { type: String, required: true },
  riderId: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  status: {
    type: String,
    enum: ['pickup', 'in_transit', 'delivered_pending', 'delivered'],
    default: 'pickup'
  },
  riderLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  trackingEvents: [{
    type: { type: String, enum: ['start', 'stop'] },
    timestamp: { type: Date, default: Date.now }
  }],
  path: [{
    lat: { type: Number },
    lng: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
