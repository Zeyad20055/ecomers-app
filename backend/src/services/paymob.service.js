const crypto = require('crypto');
const env = require('../config/env');
const Order = require('../models/Order');
const { createHttpError } = require('../middlewares/error.middleware');

function verifyTransactionHmac(obj, receivedHmac) {
  if (!env.paymob.hmacSecret || !obj || typeof receivedHmac !== 'string') return false;
  const values = [
    obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
    obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
    obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
    obj.is_voided, obj.order && obj.order.id, obj.owner, obj.pending,
    obj.source_data && obj.source_data.pan,
    obj.source_data && obj.source_data.sub_type,
    obj.source_data && obj.source_data.type, obj.success
  ];
  if (values.some((value) => value === undefined || value === null)) return false;
  const digest = crypto.createHmac('sha512', env.paymob.hmacSecret).update(values.map(String).join('')).digest('hex');
  const expected = Buffer.from(digest, 'hex');
  const received = Buffer.from(receivedHmac, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function toCustomerSummary(order) {
  return {
    orderCode: order.orderCode, customerName: order.customerName, customerPhone: order.customerPhone,
    customerEmail: order.customerEmail, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
    deliveryAddress: order.deliveryAddress,
    items: order.items.map((item) => ({ name: item.itemNameSnapshot, unitPrice: item.unitPriceSnapshot, quantity: item.quantity, subtotal: item.subtotal })),
    totalAmount: order.totalAmount, currency: order.currency, status: order.status, createdAt: order.createdAt
  };
}

function splitName(fullName) {
  const parts = String(fullName || 'Customer').trim().split(/\s+/);
  return { first_name: parts.shift() || 'Customer', last_name: parts.join(' ') || 'Customer' };
}

function assertConfigured() {
  const { secretKey, publicKey, integrationId, webhookUrl, hmacSecret } = env.paymob;
  if (!secretKey || !publicKey || !integrationId || !webhookUrl || !hmacSecret) {
    throw createHttpError(503, 'Paymob is not configured. Set its secret/public keys, integration ID, HMAC secret, and public webhook URL.', 'PAYMOB_NOT_CONFIGURED');
  }
}

async function createOrGetCheckoutUrl(orderCode) {
  const { secretKey, publicKey, integrationId, webhookUrl, baseUrl } = env.paymob;
  assertConfigured();

  const order = await Order.findOne({ orderCode }).select('+paymobClientSecret');
  if (!order) throw createHttpError(404, 'Order not found', 'ORDER_NOT_FOUND');
  if (order.paymentMethod !== 'paymob') throw createHttpError(400, 'Order does not use Paymob.', 'PAYMENT_METHOD_MISMATCH');
  if (order.paymentStatus === 'paid') throw createHttpError(409, 'Order is already paid.', 'ORDER_ALREADY_PAID');
  if (order.paymentStatus === 'pending' && order.paymobClientSecret) {
    return buildCheckoutUrl(publicKey, order.paymobClientSecret, baseUrl);
  }

  const amountCents = Math.round(order.totalAmount * 100);
  const names = splitName(order.customerName);
  const intentionBody = {
    amount: amountCents, currency: order.currency, payment_methods: [integrationId],
    items: order.items.map((item) => ({
      name: item.itemNameSnapshot, description: item.itemNameSnapshot,
      amount: Math.round(item.unitPriceSnapshot * 100) * item.quantity, quantity: item.quantity
    })),
    billing_data: {
      ...names, email: order.customerEmail, phone_number: order.customerPhone,
      street: order.deliveryAddress, building: 'NA', floor: 'NA', apartment: 'NA',
      city: 'Cairo', state: 'Cairo', country: 'EG', postal_code: 'NA'
    },
    special_reference: order.orderCode, expiration: 3600,
    notification_url: webhookUrl, redirection_url: env.paymob.redirectUrl + '?orderCode=' + encodeURIComponent(order.orderCode)
  };

  let response;
  try {
    const httpResponse = await fetch(new URL('/v1/intention/', baseUrl), {
      method: 'POST',
      headers: { Authorization: 'Token ' + secretKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(intentionBody),
      signal: AbortSignal.timeout(15000)
    });
    response = await httpResponse.json();
    if (!httpResponse.ok) {
      console.error('Paymob intention request failed with status', httpResponse.status);
      throw createHttpError(502, 'Could not start Paymob checkout. Check the Paymob configuration.', 'PAYMOB_INTENTION_FAILED');
    }
  } catch (err) {
    if (err.status) throw err;
    console.error('Paymob intention request failed:', err.message);
    throw createHttpError(502, 'Could not reach Paymob. Please retry.', 'PAYMOB_UNAVAILABLE');
  }

  if (!response.client_secret || !response.intention_order_id) {
    console.error('Paymob intention response did not contain checkout identifiers.');
    throw createHttpError(502, 'Paymob returned an incomplete checkout response.', 'PAYMOB_INVALID_RESPONSE');
  }

  order.paymobIntentionId = String(response.id || '');
  order.paymobOrderId = String(response.intention_order_id);
  order.paymobClientSecret = response.client_secret;
  order.paymentStatus = 'pending';
  await order.save();
  return buildCheckoutUrl(publicKey, response.client_secret, baseUrl);
}

function buildCheckoutUrl(publicKey, clientSecret, baseUrl) {
  const url = new URL('/unifiedcheckout/', baseUrl);
  url.searchParams.set('publicKey', publicKey);
  url.searchParams.set('clientSecret', clientSecret);
  return url.toString();
}

async function processWebhook(body, receivedHmac) {
  const obj = body && body.obj;
  if (!verifyTransactionHmac(obj, receivedHmac)) {
    throw createHttpError(401, 'Invalid Paymob callback signature.', 'INVALID_PAYMOB_SIGNATURE');
  }
  if (String(obj.integration_id) !== String(env.paymob.integrationId)) {
    console.error('Paymob callback used an unexpected integration ID.');
    return { accepted: false, newlyPaid: false };
  }

  const paymobOrderId = String(obj.order.id);
  const order = await Order.findOne({ paymobOrderId });
  if (!order || order.paymentMethod !== 'paymob' ||
      Number(obj.amount_cents) !== Math.round(order.totalAmount * 100) || obj.currency !== order.currency) {
    console.error('Paymob callback did not match a pending order amount/currency.');
    return { accepted: false, newlyPaid: false };
  }
  if (obj.pending === true || obj.is_refunded === true || obj.is_voided === true) {
    return { accepted: true, newlyPaid: false };
  }

  if (obj.success !== true) {
    await Order.updateOne(
      { _id: order._id, paymentStatus: 'pending', paymobOrderId },
      { $set: { paymentStatus: 'failed' }, $unset: { paymobClientSecret: 1 } }
    );
    return { accepted: true, newlyPaid: false };
  }

  const paid = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: 'pending', paymobOrderId },
    { $set: { paymentStatus: 'paid', paymobTransactionId: String(obj.id) }, $unset: { paymobClientSecret: 1 } },
    { new: true }
  ).lean();
  return { accepted: true, newlyPaid: Boolean(paid), order: paid ? toCustomerSummary(paid) : undefined };
}

module.exports = { assertConfigured, createOrGetCheckoutUrl, processWebhook };
