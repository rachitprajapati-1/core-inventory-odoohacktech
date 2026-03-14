const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const { protect, authorize } = require('../middleware/auth');

// Export products to Excel
router.get('/products/excel', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CoreInventory';
    const sheet = workbook.addWorksheet('Products');

    // Header styling
    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Total Stock', key: 'totalStock', width: 15 },
      { header: 'Reorder Level', key: 'reorderLevel', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Cost Price', key: 'costPrice', width: 15 },
      { header: 'Selling Price', key: 'sellingPrice', width: 15 },
      { header: 'Supplier', key: 'supplier', width: 20 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    products.forEach(p => {
      const status = p.totalStock === 0 ? 'Out of Stock' : p.totalStock <= p.reorderLevel ? 'Low Stock' : 'In Stock';
      const row = sheet.addRow({
        sku: p.sku, name: p.name,
        category: p.category?.name || 'N/A',
        unit: p.unit, totalStock: p.totalStock,
        reorderLevel: p.reorderLevel, status,
        costPrice: p.costPrice, sellingPrice: p.sellingPrice,
        supplier: p.supplier,
      });

      // Color-code status
      const statusCell = row.getCell('status');
      if (status === 'Out of Stock') statusCell.font = { color: { argb: 'FFEF4444' } };
      else if (status === 'Low Stock') statusCell.font = { color: { argb: 'FFF59E0B' } };
      else statusCell.font = { color: { argb: 'FF10B981' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export Stock Ledger to Excel
router.get('/ledger/excel', protect, async (req, res) => {
  try {
    const { from, to, product, warehouse } = req.query;
    const query = {};
    if (from || to) query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
    if (product) query.product = product;
    if (warehouse) query.warehouse = warehouse;

    const entries = await Ledger.find(query)
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5000);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stock Ledger');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Reference', key: 'reference', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Product', key: 'product', width: 25 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Qty', key: 'qty', width: 12 },
      { header: 'Balance Before', key: 'before', width: 15 },
      { header: 'Balance After', key: 'after', width: 15 },
      { header: 'Performed By', key: 'by', width: 18 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };

    entries.forEach(e => {
      const row = sheet.addRow({
        date: e.createdAt.toLocaleString(),
        reference: e.reference,
        type: e.type.replace('_', ' ').toUpperCase(),
        product: e.product?.name || '',
        sku: e.product?.sku || '',
        warehouse: e.warehouse?.name || '',
        qty: e.quantity,
        before: e.balanceBefore,
        after: e.balanceAfter,
        by: e.performedBy?.name || '',
        notes: e.notes,
      });
      const qtyCell = row.getCell('qty');
      qtyCell.font = { color: { argb: e.quantity >= 0 ? 'FF10B981' : 'FFEF4444' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ledger_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export products to PDF
router.get('/products/pdf', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .sort({ name: 1 });

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 70).fill('#4F46E5');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('CoreInventory — Product Report', 40, 22);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, 40, 50);
    doc.fillColor('#1f2937');

    // Table
    let y = 90;
    const cols = [{ label: 'SKU', x: 40, w: 90 }, { label: 'Name', x: 140, w: 160 },
      { label: 'Category', x: 310, w: 100 }, { label: 'Stock', x: 420, w: 60 },
      { label: 'Status', x: 490, w: 80 }, { label: 'Cost', x: 580, w: 70 }, { label: 'Sell Price', x: 660, w: 70 }];

    // Table header
    doc.rect(30, y - 5, doc.page.width - 60, 20).fill('#e5e7eb');
    doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold');
    cols.forEach(c => doc.text(c.label, c.x, y, { width: c.w }));
    y += 18;

    doc.font('Helvetica').fontSize(8);
    products.forEach((p, i) => {
      if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
      if (i % 2 === 0) doc.rect(30, y - 3, doc.page.width - 60, 16).fill('#f9fafb');

      const status = p.totalStock === 0 ? 'Out of Stock' : p.totalStock <= p.reorderLevel ? 'Low Stock' : 'In Stock';
      const statusColor = p.totalStock === 0 ? '#EF4444' : p.totalStock <= p.reorderLevel ? '#F59E0B' : '#10B981';

      doc.fillColor('#111827');
      doc.text(p.sku, cols[0].x, y, { width: cols[0].w });
      doc.text(p.name, cols[1].x, y, { width: cols[1].w });
      doc.text(p.category?.name || '-', cols[2].x, y, { width: cols[2].w });
      doc.text(String(p.totalStock), cols[3].x, y, { width: cols[3].w });
      doc.fillColor(statusColor).text(status, cols[4].x, y, { width: cols[4].w });
      doc.fillColor('#111827');
      doc.text(`₹${p.costPrice}`, cols[5].x, y, { width: cols[5].w });
      doc.text(`₹${p.sellingPrice}`, cols[6].x, y, { width: cols[6].w });
      y += 16;
    });

    // Footer
    doc.rect(0, doc.page.height - 35, doc.page.width, 35).fill('#4F46E5');
    doc.fillColor('white').fontSize(9).text(`Total Products: ${products.length}  |  CoreInventory © ${new Date().getFullYear()}`, 40, doc.page.height - 22);

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
