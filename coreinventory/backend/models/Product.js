const mongoose = require('mongoose');

const stockByLocationSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationName: { type: String, default: 'Main' },
  quantity: { type: Number, default: 0, min: 0 },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  barcode: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  unit: { type: String, default: 'pcs', enum: ['pcs', 'kg', 'g', 'liter', 'ml', 'box', 'set', 'meter', 'sqm', 'ton'] },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  costPrice: { type: Number, default: 0, min: 0 },
  sellingPrice: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 10, min: 0 },
  maxStock: { type: Number, default: 1000, min: 0 },
  stockByLocation: [stockByLocationSchema],
  totalStock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  supplier: { type: String, default: '' },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.totalStock === 0) return 'out_of_stock';
  if (this.totalStock <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
