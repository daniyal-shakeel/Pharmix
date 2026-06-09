const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  medicineId: { type: String, required: true },
  medicineName: { type: String, required: true },
  manufacturerId: { type: String, required: true },
  oldQty: { type: Number, required: true },
  newQty: { type: Number, required: true },
  type: { type: String, enum: ['manual', 'order'], default: 'manual' },
  referenceId: { type: String }, // e.g. Order ID if type is 'order'
  changedBy: { type: String, required: true }, // User ID or Email
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockHistory', stockHistorySchema);
