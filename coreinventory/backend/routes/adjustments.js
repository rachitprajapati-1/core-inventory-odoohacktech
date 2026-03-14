const express = require('express');
const router = express.Router();
const Adjustment = require('../models/Adjustment');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { status, warehouse, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;

    const total = await Adjustment.countDocuments(query);
    const adjustments = await Adjustment.find(query)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, adjustments, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const adj = await Adjustment.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku unit totalStock')
      .populate('createdBy', 'name')
      .populate('validatedBy', 'name');
    if (!adj) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, adjustment: adj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    // Auto-fill theoretical quantities
    const lines = [];
    for (const line of req.body.lines || []) {
      const product = await Product.findById(line.product);
      const theoretical = product ? product.totalStock : 0;
      lines.push({
        ...line,
        theoreticalQty: theoretical,
        difference: line.countedQty - theoretical,
      });
    }
    const adj = await Adjustment.create({ ...req.body, lines, createdBy: req.user._id });
    res.status(201).json({ success: true, adjustment: adj });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const adj = await Adjustment.findById(req.params.id);
    if (!adj) return res.status(404).json({ success: false, message: 'Not found' });
    if (adj.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });
    Object.assign(adj, req.body);
    await adj.save();
    res.json({ success: true, adjustment: adj });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Validate adjustment — sets stock to counted quantity
router.post('/:id/validate', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const adj = await Adjustment.findById(req.params.id).populate('lines.product');
    if (!adj) return res.status(404).json({ success: false, message: 'Not found' });
    if (adj.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });

    for (const line of adj.lines) {
      const product = await Product.findById(line.product._id || line.product);
      const before = product.totalStock;
      const diff = line.countedQty - line.theoreticalQty;

      // Update stock by warehouse location
      const locIdx = product.stockByLocation.findIndex(
        s => s.warehouse.toString() === adj.warehouse.toString()
      );
      if (locIdx >= 0) {
        product.stockByLocation[locIdx].quantity = line.countedQty;
      } else {
        product.stockByLocation.push({ warehouse: adj.warehouse, locationName: 'Main', quantity: line.countedQty });
      }

      // Recalculate total stock
      product.totalStock = product.stockByLocation.reduce((sum, sl) => sum + sl.quantity, 0);
      product.markModified('stockByLocation');
      await product.save();

      await Ledger.create({
        product: product._id, warehouse: adj.warehouse, type: 'adjustment',
        reference: adj.reference, quantity: diff, balanceBefore: before,
        balanceAfter: product.totalStock, unit: line.unit || product.unit,
        performedBy: req.user._id,
        notes: `Stock adjustment: ${diff > 0 ? '+' : ''}${diff}`,
      });
    }

    adj.status = 'done';
    adj.validatedBy = req.user._id;
    adj.validatedAt = new Date();
    await adj.save();

    const io = req.app.get('io');
    io.emit('stock:updated');
    const Notification = require('../models/Notification');
const notif = await Notification.create({
  title: 'Stock Adjusted ⚖️',
  message: `${adj.reference} stock adjustment applied successfully.`,
  type: 'warning',
  category: 'adjustment',
  isGlobal: true,
});
io.emit('notification:new', { notification: notif });

    res.json({ success: true, adjustment: adj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
