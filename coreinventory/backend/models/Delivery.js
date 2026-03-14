const mongoose = require('mongoose');

const deliveryLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQty: { type: Number, default: 0, min: 0 },
  shippedQty: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'pcs' },
});

const deliverySchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  customerRef: { type: String, default: '' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  scheduledDate: { type: Date },
  shippingAddress: { type: String, default: '' },
  lines: [deliveryLineSchema],
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
    default: 'draft',
  },
  stage: { type: String, enum: ['pick', 'pack', 'validate'], default: 'pick' },
  notes: { type: String, default: '' },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

deliverySchema.pre('validate', async function (next) {
  if (!this.reference) {
    const count = await this.constructor.countDocuments();
    this.reference = `DEL-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
