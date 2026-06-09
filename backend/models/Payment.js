const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  stripePaymentIntentId: { type: String, required: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'pkr' },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'pending' },
  manufacturerId: { type: String, required: true },
  pharmacyId: { type: String, required: true },
  paymentMethod: { type: String }, // e.g. 'card'
  receiptUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
