const mongoose = require('mongoose');

const adjustmentLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  location: { type: String, default: 'Main' },
  theoreticalQty: { type: Number, default: 0 },
  countedQty: { type: Number, required: true, min: 0 },
  difference: { type: Number, default: 0 },
  unit: { type: String, default: 'pcs' },
});

const adjustmentSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  lines: [adjustmentLineSchema],
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'done', 'canceled'],
    default: 'draft',
  },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

adjustmentSchema.pre('validate', async function (next) {
  if (!this.reference) {
    const count = await this.constructor.countDocuments();
    this.reference = `ADJ-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);
