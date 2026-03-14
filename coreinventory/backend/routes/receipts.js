const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/receipts
router.get('/', protect, async (req, res) => {
  try {
    const { status, warehouse, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (search) query.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } },
    ];

    const total = await Receipt.countDocuments(query);
    const receipts = await Receipt.find(query)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, receipts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/receipts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku unit image')
      .populate('createdBy', 'name email')
      .populate('validatedBy', 'name');
    if (!receipt) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/receipts
router.post('/', protect, async (req, res) => {
  try {
    const receipt = await Receipt.create({ ...req.body, createdBy: req.user._id });
    await receipt.populate('warehouse', 'name code');
    const io = req.app.get('io');
    io.emit('receipt:created', { receipt });
    res.status(201).json({ success: true, receipt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/receipts/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit validated receipt' });

    Object.assign(receipt, req.body);
    await receipt.save();
    res.json({ success: true, receipt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @POST /api/receipts/:id/validate  — increases stock
router.post('/:id/validate', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('lines.product');
    if (!receipt) return res.status(404).json({ success: false, message: 'Not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });

    for (const line of receipt.lines) {
      const qty = line.receivedQty || line.expectedQty;
      if (qty <= 0) continue;
      const product = await Product.findById(line.product._id || line.product);

      // Update stock by location
      const locIdx = product.stockByLocation.findIndex(
        s => s.warehouse.toString() === receipt.warehouse.toString()
      );
      const before = product.totalStock;

      if (locIdx >= 0) {
        product.stockByLocation[locIdx].quantity += qty;
      } else {
        product.stockByLocation.push({ warehouse: receipt.warehouse, locationName: 'Main', quantity: qty });
      }
      product.totalStock += qty;
      product.markModified('stockByLocation');
      await product.save();

      // Log ledger
      await Ledger.create({
        product: product._id, warehouse: receipt.warehouse, type: 'receipt',
        reference: receipt.reference, quantity: qty, balanceBefore: before,
        balanceAfter: product.totalStock, unit: line.unit || product.unit,
        performedBy: req.user._id, notes: `Receipt from ${receipt.supplier}`,
      });
    }

    receipt.status = 'done';
    receipt.validatedBy = req.user._id;
    receipt.validatedAt = new Date();
    await receipt.save();

    // Emit real-time
    const io = req.app.get('io');
    io.emit('receipt:validated', { receiptId: receipt._id, reference: receipt.reference });
    io.emit('stock:updated');
    const Notification = require('../models/Notification');
const notif = await Notification.create({
  title: 'Receipt Validated ✅',
  message: `${receipt.reference} from ${receipt.supplier} has been validated. Stock updated.`,
  type: 'success',
  category: 'receipt',
  isGlobal: true,
});
io.emit('notification:new', { notification: notif })

    res.json({ success: true, receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/receipts/:id/cancel
router.post('/:id/cancel', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel validated receipt' });
    receipt.status = 'canceled';
    await receipt.save();
    res.json({ success: true, receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
