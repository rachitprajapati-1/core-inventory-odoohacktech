const nodemailer = require('nodemailer');

const getTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOTPEmail = async (to, otp, name) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"CoreInventory" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset OTP — CoreInventory',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#f9fafb;border-radius:12px;padding:32px;">
        <div style="background:#4F46E5;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:24px;">CoreInventory</h1>
        </div>
        <h2 style="color:#111827;">Hi ${name},</h2>
        <p style="color:#4B5563;">You requested a password reset. Use this OTP:</p>
        <div style="background:#4F46E5;color:#fff;font-size:36px;font-weight:bold;text-align:center;letter-spacing:8px;padding:20px;border-radius:8px;margin:20px 0;">
          ${otp}
        </div>
        <p style="color:#6B7280;font-size:13px;">This OTP expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

const sendLowStockAlert = async (to, products) => {
  const transporter = getTransporter();
  const rows = products.map(p =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${p.name}</td>
     <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${p.sku}</td>
     <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${p.totalStock === 0 ? '#EF4444' : '#F59E0B'};">${p.totalStock}</td>
     <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${p.reorderLevel}</td></tr>`
  ).join('');

  await transporter.sendMail({
    from: `"CoreInventory Alerts" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⚠️ Low Stock Alert — ${products.length} products need attention`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <div style="background:#F59E0B;padding:16px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;">⚠️ Low Stock Alert</h2>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;">Product</th>
              <th style="padding:8px;text-align:left;">SKU</th>
              <th style="padding:8px;text-align:left;">Current Stock</th>
              <th style="padding:8px;text-align:left;">Reorder Level</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail, sendLowStockAlert };
