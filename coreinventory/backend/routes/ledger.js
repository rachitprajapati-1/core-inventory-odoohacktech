// routes/ledger.js
const express = require('express');
const router = express.Router();
const Ledger = require('../models/Ledger');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { product, warehouse, type, page = 1, limit = 50 } = req.query;
    const query = {};
    if (product) query.product = product;
    if (warehouse) query.warehouse = warehouse;
    if (type) query.type = type;

    const total = await Ledger.countDocuments(query);
    const entries = await Ledger.find(query)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, entries, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
