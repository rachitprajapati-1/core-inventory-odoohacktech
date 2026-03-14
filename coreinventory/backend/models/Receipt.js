const mongoose = require('mongoose');

const receiptLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  expectedQty: { type: Number, default: 0, min: 0 },
  receivedQty: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'pcs' },
  notes: { type: String, default: '' },
});

const receiptSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  supplier: { type: String, required: true },
  supplierRef: { type: String, default: '' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  scheduledDate: { type: Date },
  lines: [receiptLineSchema],
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
    default: 'draft',
  },
  notes: { type: String, default: '' },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate reference
receiptSchema.pre('validate', async function (next) {
  if (!this.reference) {
    const count = await this.constructor.countDocuments();
    this.reference = `REC-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);
