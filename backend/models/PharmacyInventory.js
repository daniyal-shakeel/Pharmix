const mongoose = require('mongoose');

const pharmacyInventorySchema = new mongoose.Schema({
  pharmacyId: { type: String, required: true },
  medicineId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  expiry: { type: String, required: true },
  manufacturerId: { type: String, required: true }
}, { timestamps: true });

// A pharmacy can only have one entry per medicine in their local inventory
pharmacyInventorySchema.index({ pharmacyId: 1, medicineId: 1 }, { unique: true });

module.exports = mongoose.model('PharmacyInventory', pharmacyInventorySchema);
