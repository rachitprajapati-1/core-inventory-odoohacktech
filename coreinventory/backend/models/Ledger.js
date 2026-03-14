const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  location: { type: String, default: 'Main' },
  type: {
    type: String,
    enum: ['receipt', 'delivery', 'transfer_in', 'transfer_out', 'adjustment', 'initial'],
    required: true,
  },
  reference: { type: String, required: true },
  quantity: { type: Number, required: true }, // positive = in, negative = out
  balanceBefore: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: 0 },
  unit: { type: String, default: 'pcs' },
  notes: { type: String, default: '' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
