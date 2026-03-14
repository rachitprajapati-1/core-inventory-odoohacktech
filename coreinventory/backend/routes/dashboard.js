const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const Ledger = require('../models/Ledger');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true }).catch(() => 0);
    const outOfStock = await Product.countDocuments({ isActive: true, totalStock: 0 }).catch(() => 0);
    const pendingReceipts = await Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }).catch(() => 0);
    const pendingDeliveries = await Delivery.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }).catch(() => 0);
    const scheduledTransfers = await Transfer.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }).catch(() => 0);

    const allProducts = await Product.find({ isActive: true }, 'totalStock reorderLevel').catch(() => []);
    const lowStock = allProducts.filter(p => p.totalStock > 0 && p.totalStock <= p.reorderLevel).length;

    const recentMovements = await Ledger.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .populate('performedBy', 'name')
      .catch(() => []);

    let movementData = [];
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      movementData = await Ledger.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type',
            },
            total: { $sum: { $abs: '$quantity' } },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]);
    } catch (e) {
      console.log('Movement chart error:', e.message);
      movementData = [];
    }

    let categoryDist = [];
    try {
      categoryDist = await Product.aggregate([
        { $match: { isActive: true, category: { $ne: null } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$totalStock' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'cat',
          },
        },
        {
          $project: {
            name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
            color: { $ifNull: [{ $arrayElemAt: ['$cat.color', 0] }, '#6366f1'] },
            count: 1,
            totalStock: 1,
          },
        },
      ]);
    } catch (e) {
      console.log('Category dist error:', e.message);
      categoryDist = [];
    }

    const topProducts = await Product.find({ isActive: true })
      .sort({ totalStock: -1 })
      .limit(5)
      .populate('category', 'name color')
      .catch(() => []);

    res.json({
      success: true,
      stats: {
        totalProducts,
        lowStock,
        outOfStock,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
      },
      recentMovements,
      movementData,
      categoryDist,
      topProducts,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
// ```

// ---

// ## After saving the file

// Backend will **auto-restart** (nodemon detects the change). You'll see:
// ```
// [nodemon] restarting due to changes...
// 🚀 CoreInventory Server running on port 5000