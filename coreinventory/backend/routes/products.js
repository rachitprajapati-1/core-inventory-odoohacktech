const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/products
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, status, warehouse, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = category;
    if (status === 'low_stock') query.$expr = { $and: [{ $gt: ['$totalStock', 0] }, { $lte: ['$totalStock', '$reorderLevel'] }] };
    if (status === 'out_of_stock') query.totalStock = 0;
    if (status === 'in_stock') query.$expr = { $gt: ['$totalStock', '$reorderLevel'] };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name color')
      .populate('stockByLocation.warehouse', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name color')
      .populate('stockByLocation.warehouse', 'name code');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/products
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { name, sku, category, unit, description, costPrice, sellingPrice,
  reorderLevel, maxStock, supplier, tags, barcode, initialStock, warehouseId } = req.body;

const product = new Product({
  name, sku,
  category: category || undefined,   // ← fix is here
  unit, description, costPrice, sellingPrice,
  reorderLevel, maxStock, supplier, tags, barcode, createdBy: req.user._id,
});

    if (initialStock && warehouseId) {
      product.stockByLocation = [{ warehouse: warehouseId, locationName: 'Main', quantity: initialStock }];
      product.totalStock = initialStock;
    }

    await product.save();

    // Log initial stock
    if (initialStock && warehouseId) {
      await Ledger.create({
        product: product._id, warehouse: warehouseId, type: 'initial',
        reference: 'INIT', quantity: initialStock, balanceBefore: 0,
        balanceAfter: initialStock, unit: unit || 'pcs', performedBy: req.user._id,
        notes: 'Initial stock entry',
      });
    }

    const io = req.app.get('io');
    io.emit('product:created', { product });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/products/:id
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    if (req.body.category === '') req.body.category = undefined;
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('category', 'name color');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const io = req.app.get('io');
    io.emit('product:updated', { product });

    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/products/:id (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product archived' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/search/barcode/:barcode
router.get('/search/barcode/:barcode', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode })
      .populate('category', 'name color');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
