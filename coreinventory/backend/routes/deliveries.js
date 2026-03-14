const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { status, warehouse, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (search) query.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { customer: { $regex: search, $options: 'i' } },
    ];

    const total = await Delivery.countDocuments(query);
    const deliveries = await Delivery.find(query)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, deliveries, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku unit image totalStock')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name');
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const delivery = await Delivery.create({ ...req.body, createdBy: req.user._id });
    await delivery.populate('warehouse', 'name code');
    const io = req.app.get('io');
    io.emit('delivery:created', { delivery });
    res.status(201).json({ success: true, delivery });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit validated delivery' });
    Object.assign(delivery, req.body);
    await delivery.save();
    res.json({ success: true, delivery });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Validate delivery — decreases stock
router.post('/:id/validate', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('lines.product');
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });

    for (const line of delivery.lines) {
      const qty = line.shippedQty || line.orderedQty;
      if (qty <= 0) continue;
      const product = await Product.findById(line.product._id || line.product);

      if (product.totalStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}`,
        });
      }

      const locIdx = product.stockByLocation.findIndex(
        s => s.warehouse.toString() === delivery.warehouse.toString()
      );
      const before = product.totalStock;

      if (locIdx >= 0) {
        product.stockByLocation[locIdx].quantity = Math.max(0, product.stockByLocation[locIdx].quantity - qty);
      }
      product.totalStock = Math.max(0, product.totalStock - qty);
      product.markModified('stockByLocation');
      await product.save();

      await Ledger.create({
        product: product._id, warehouse: delivery.warehouse, type: 'delivery',
        reference: delivery.reference, quantity: -qty, balanceBefore: before,
        balanceAfter: product.totalStock, unit: line.unit || product.unit,
        performedBy: req.user._id, notes: `Delivery to ${delivery.customer}`,
      });
    }

    delivery.status = 'done';
    delivery.stage = 'validate';
    delivery.validatedBy = req.user._id;
    delivery.validatedAt = new Date();
    await delivery.save();

    const io = req.app.get('io');
    io.emit('delivery:validated', { deliveryId: delivery._id });
    io.emit('stock:updated');
    const Notification = require('../models/Notification');
const notif = await Notification.create({
  title: 'Delivery Validated 🚚',
  message: `${delivery.reference} to ${delivery.customer} has been validated. Stock deducted.`,
  type: 'success',
  category: 'delivery',
  isGlobal: true,
});
io.emit('notification:new', { notification: notif });

    res.json({ success: true, delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/cancel', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel validated delivery' });
    delivery.status = 'canceled';
    await delivery.save();
    res.json({ success: true, delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
