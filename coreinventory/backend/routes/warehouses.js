const express = require('express');
const router = express.Router();
const Warehouse = require('../models/Warehouse');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, warehouses });
});

router.get('/:id', protect, async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, warehouse });
});

router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const warehouse = await Warehouse.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, warehouse });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  await Warehouse.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Warehouse deactivated' });
});

// Add location to warehouse
router.post('/:id/locations', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    warehouse.locations.push(req.body);
    await warehouse.save();
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
