const express = require('express');
const router = express.Router();
const bwipjs = require('bwip-js');
const QRCode = require('qrcode');
const { protect } = require('../middleware/auth');

// Generate barcode image
router.get('/generate/:text', protect, async (req, res) => {
  try {
    const { text } = req.params;
    const { type = 'code128' } = req.query;

    const png = await bwipjs.toBuffer({
      bcid: type,
      text: text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    res.set('Content-Type', 'image/png');
    res.send(png);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate QR code
router.get('/qr/:text', protect, async (req, res) => {
  try {
    const { text } = req.params;
    const dataUrl = await QRCode.toDataURL(text, { width: 200, margin: 2 });
    res.json({ success: true, dataUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate barcode as data URL for frontend display
router.get('/dataurl/:text', protect, async (req, res) => {
  try {
    const { text } = req.params;
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: text,
      scale: 2,
      height: 8,
      includetext: true,
      textxalign: 'center',
    });
    const base64 = `data:image/png;base64,${png.toString('base64')}`;
    res.json({ success: true, dataUrl: base64 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
