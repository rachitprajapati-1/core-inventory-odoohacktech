const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.reference = { $regex: search, $options: 'i' };

    const total = await Transfer.countDocuments(query);
    const transfers = await Transfer.find(query)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, transfers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku unit image totalStock')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name');
    if (!transfer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, transfer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const transfer = await Transfer.create({ ...req.body, createdBy: req.user._id });
    const io = req.app.get('io');
    io.emit('transfer:created', { transfer });
    res.status(201).json({ success: true, transfer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Not found' });
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Already completed' });
    Object.assign(transfer, req.body);
    await transfer.save();
    res.json({ success: true, transfer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Validate transfer — moves stock between warehouses
router.post('/:id/validate', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id).populate('lines.product');
    if (!transfer) return res.status(404).json({ success: false, message: 'Not found' });
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });

    for (const line of transfer.lines) {
      const qty = line.quantity;
      if (qty <= 0) continue;
      const product = await Product.findById(line.product._id || line.product);

      // Check source stock
      const fromLocIdx = product.stockByLocation.findIndex(
        s => s.warehouse.toString() === transfer.fromWarehouse.toString()
      );
      const fromQty = fromLocIdx >= 0 ? product.stockByLocation[fromLocIdx].quantity : 0;

      if (fromQty < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} in source warehouse. Available: ${fromQty}`,
        });
      }

      const before = product.totalStock;

      // Decrease from source
      if (fromLocIdx >= 0) {
        product.stockByLocation[fromLocIdx].quantity -= qty;
      }

      // Increase at destination
      const toLocIdx = product.stockByLocation.findIndex(
        s => s.warehouse.toString() === transfer.toWarehouse.toString()
      );
      if (toLocIdx >= 0) {
        product.stockByLocation[toLocIdx].quantity += qty;
      } else {
        product.stockByLocation.push({ warehouse: transfer.toWarehouse, locationName: transfer.toLocation || 'Main', quantity: qty });
      }

      product.markModified('stockByLocation');
      await product.save();

      // Two ledger entries
      await Ledger.create({
        product: product._id, warehouse: transfer.fromWarehouse, type: 'transfer_out',
        reference: transfer.reference, quantity: -qty, balanceBefore: before,
        balanceAfter: before, unit: line.unit || product.unit,
        performedBy: req.user._id, notes: `Transfer out to ${transfer.toWarehouse}`,
      });
      await Ledger.create({
        product: product._id, warehouse: transfer.toWarehouse, type: 'transfer_in',
        reference: transfer.reference, quantity: qty, balanceBefore: before,
        balanceAfter: before, unit: line.unit || product.unit,
        performedBy: req.user._id, notes: `Transfer in from ${transfer.fromWarehouse}`,
      });
    }

    transfer.status = 'done';
    transfer.validatedBy = req.user._id;
    transfer.validatedAt = new Date();
    await transfer.save();

    const io = req.app.get('io');
    io.emit('transfer:validated', { transferId: transfer._id });
    io.emit('stock:updated');
    const Notification = require('../models/Notification');
const notif = await Notification.create({
  title: 'Transfer Validated 🔄',
  message: `${transfer.reference} stock moved between warehouses successfully.`,
  type: 'info',
  category: 'transfer',
  isGlobal: true,
});
io.emit('notification:new', { notification: notif });

    res.json({ success: true, transfer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/cancel', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel completed transfer' });
    transfer.status = 'canceled';
    await transfer.save();
    res.json({ success: true, transfer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
