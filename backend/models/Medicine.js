const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  manufacturer: { type: String, required: true },
  manufacturerId: { type: String, required: true },
  batch: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  expiry: { type: String, required: true },
  image: { type: String, default: '' },
  rx: { type: Boolean, default: false },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
