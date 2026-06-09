const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  recipientRole: { type: String, required: true, enum: ['admin', 'manufacturer', 'pharmacy', 'delivery', 'customer'] },
  recipientId: { type: String, required: true }, // The entityId (e.g. MFR-XXX)
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'shipment', 'payment', 'approval', 'system'], default: 'system' },
  metadata: { type: Object, default: {} },
  isOpened: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
