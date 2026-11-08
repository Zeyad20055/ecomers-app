const nodemailer = require('nodemailer');
const env = require('../config/env');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(amount, currency) {
  return `${Number(amount).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function createOrderRows(items, currency) {
  return items.map((item) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(item.name)}</td>
      <td style="padding:8px;border:1px solid #ddd">${item.quantity}</td>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(formatAmount(item.unitPrice, currency))}</td>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(formatAmount(item.subtotal, currency))}</td>
    </tr>`).join('');
}

async function sendOrderConfirmation(order) {
  const { host, port, secure, user, pass, from } = env.smtp;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !from || Boolean(user) !== Boolean(pass)) {
    throw new Error('SMTP is not configured correctly. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM; set both SMTP_USER and SMTP_PASS or leave both empty.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
  const storeName = escapeHtml(env.store.name);
  const itemsText = order.items.map((item) =>
    `- ${item.name} × ${item.quantity}: ${formatAmount(item.subtotal, order.currency)}`
  ).join('\n');

  await transporter.sendMail({
    from,
    to: order.customerEmail,
    subject: `تأكيد استلام طلبك ${order.orderCode}`,
    text: [
      `مرحباً ${order.customerName}،`,
      '',
      `تم استلام طلبك رقم ${order.orderCode}، وهو الآن قيد التجهيز.`,
      '',
      'تفاصيل الطلب:',
      itemsText,
      '',
      `الإجمالي: ${formatAmount(order.totalAmount, order.currency)}`,
      '',
      `شكراً لطلبك من ${env.store.name}.`
    ].join('\n'),
    html: `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <body style="margin:0;padding:24px;background:#f6f7f5;font-family:Arial,sans-serif;color:#24342b">
          <div style="max-width:640px;margin:auto;padding:24px;background:#fff;border-radius:12px">
            <h1 style="font-size:22px">تأكيد استلام طلبك</h1>
            <p>مرحباً ${escapeHtml(order.customerName)}،</p>
            <p>تم استلام طلبك رقم <strong dir="ltr">${escapeHtml(order.orderCode)}</strong>، وهو الآن قيد التجهيز.</p>
            <h2 style="font-size:18px">تفاصيل الطلب</h2>
            <table style="width:100%;border-collapse:collapse;text-align:right">
              <thead>
                <tr>
                  <th style="padding:8px;border:1px solid #ddd">المنتج</th>
                  <th style="padding:8px;border:1px solid #ddd">الكمية</th>
                  <th style="padding:8px;border:1px solid #ddd">سعر الوحدة</th>
                  <th style="padding:8px;border:1px solid #ddd">الإجمالي</th>
                </tr>
              </thead>
              <tbody>${createOrderRows(order.items, order.currency)}</tbody>
            </table>
            <p style="font-size:18px"><strong>إجمالي الطلب: ${escapeHtml(formatAmount(order.totalAmount, order.currency))}</strong></p>
            <p>شكراً لطلبك من ${storeName}.</p>
          </div>
        </body>
      </html>`
  });
}

module.exports = { sendOrderConfirmation };
