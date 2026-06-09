const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
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
  linkedDeliveryPartners: [{ type: String }],
  shippingFee: { type: Number, default: 500 },
  deliveryConfig: {
    smallOrderTime: { type: Number, default: 4320 },
    mediumOrderTime: { type: Number, default: 7200 },
    largeOrderTime: { type: Number, default: 10080 },
    smallThreshold: { type: Number, default: 50 },
    mediumThreshold: { type: Number, default: 200 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
