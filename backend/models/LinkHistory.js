const mongoose = require('mongoose');

const linkHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sourceId: { type: String, required: true },
  sourceType: { type: String, required: true, enum: ['manufacturer', 'pharmacy', 'delivery'] },
  targetId: { type: String, required: true },
  targetType: { type: String, required: true, enum: ['manufacturer', 'pharmacy', 'delivery'] },
  status: { type: String, enum: ['active', 'unlinked'], default: 'active' },
  linkedAt: { type: Date, default: Date.now },
  unlinkedAt: { type: Date },
  linkedBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LinkHistory', linkHistorySchema);
