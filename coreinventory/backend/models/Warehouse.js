const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['rack', 'shelf', 'zone', 'floor'], default: 'rack' },
});

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  locations: [locationSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
