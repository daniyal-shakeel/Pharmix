const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  pharmacyId: { type: String, required: true }, // The user who owns the cart
  manufacturerId: { type: String, required: true }, // The manufacturer this cart belongs to
  items: [cartItemSchema],
  tax: { type: Number, default: 0 }
}, { timestamps: true });

// A pharmacy can only have one active cart per manufacturer
cartSchema.index({ pharmacyId: 1, manufacturerId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);
