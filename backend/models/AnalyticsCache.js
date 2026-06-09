const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  manufacturerId: { type: String, required: true, unique: true },
  revenueData: [{
    month: String,
    revenue: Number,
    orders: Number
  }],
  categoryData: [{
    category: String,
    demand: Number
  }],
  deliveryData: [{
    day: String,
    onTime: Number,
    delayed: Number
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);
