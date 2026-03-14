const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  category: { type: String, enum: ['low_stock', 'out_of_stock', 'receipt', 'delivery', 'transfer', 'adjustment', 'system'], default: 'system' },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  relatedDoc: { type: String, default: '' },
  relatedModel: { type: String, default: '' },
  isGlobal: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
