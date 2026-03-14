const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ recipients: req.user._id }, { isGlobal: true }],
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = notifications.filter(n => !n.readBy.includes(req.user._id)).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif.readBy.includes(req.user._id)) {
      notif.readBy.push(req.user._id);
      await notif.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/markallread', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ recipients: req.user._id }, { isGlobal: true }], readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Internal utility to create notification
const createNotification = async (io, data) => {
  const notif = await Notification.create(data);
  if (io) io.emit('notification:new', { notification: notif });
  return notif;
};

module.exports = router;
module.exports.createNotification = createNotification;
