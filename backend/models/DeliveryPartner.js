const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: "N/A" },
  vehicle: { type: String, default: "N/A" },
  zone: { type: String, default: "N/A" },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedDate: { type: String, required: true },
  rating: { type: Number, default: 5.0 },
  totalDeliveries: { type: Number, default: 0 },
  linkedManufacturers: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
