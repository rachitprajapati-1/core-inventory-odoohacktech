const mongoose = require('mongoose');

const transferLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'pcs' },
  done: { type: Number, default: 0 },
});

const transferSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  fromLocation: { type: String, default: 'Main' },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toLocation: { type: String, default: 'Main' },
  scheduledDate: { type: Date },
  lines: [transferLineSchema],
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
    default: 'draft',
  },
  reason: { type: String, default: '' },
  notes: { type: String, default: '' },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

transferSchema.pre('validate', async function (next) {
  if (!this.reference) {
    const count = await this.constructor.countDocuments();
    this.reference = `INT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Transfer', transferSchema);
