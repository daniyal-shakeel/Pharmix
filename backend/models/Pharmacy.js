const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  region: { type: String, default: "N/A" },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: "N/A" },
  address: { type: String, default: "N/A" },
  status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'active' },
  joinedDate: { type: String, required: true },
  totalSkus: { type: Number, default: 0 },
  description: { type: String, default: "" },
  linkedManufacturers: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
