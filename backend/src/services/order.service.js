const crypto = require('crypto');
const env = require('../config/env');
const Category = require('../models/Category');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { createHttpError } = require('../middlewares/error.middleware');

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Order codes look like ORD-20261028-7F3A9C (date + random suffix).
function generateOrderCode() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ymd}-${suffix}`;
}

// What the customer gets back after submitting: no internal notes, no stock data.
function toCustomerSummary(order) {
  return {
    orderCode: order.orderCode,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    paymentMethod: order.paymentMethod || 'cash_on_delivery',
    paymentStatus: order.paymentStatus || 'not_required',
    deliveryAddress: order.deliveryAddress,
    items: order.items.map((l) => ({
      name: l.itemNameSnapshot,
      unitPrice: l.unitPriceSnapshot,
      quantity: l.quantity,
      subtotal: l.subtotal
    })),
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt
  };
}

// Manager view: full order, minus the internal idempotency key and __v.
function toManagerOrder(order) {
  const { clientRequestId, __v, ...rest } = order;
  return rest;
}

async function createOrder(payload) {
  if (payload.clientRequestId) {
    const existing = await Order.findOne({ clientRequestId: String(payload.clientRequestId) }).lean();
    if (existing) return { order: toCustomerSummary(existing), duplicate: true };
  }

  // Merge repeated lines of the same item
  const requested = new Map();
  payload.items.forEach((line) => {
    const id = String(line.item);
    requested.set(id, (requested.get(id) || 0) + Number(line.quantity));
  });

  const items = await Item.find({ _id: { $in: [...requested.keys()] } })
    .populate('category', 'isActive')
    .lean();
  const byId = new Map(items.map((i) => [i._id.toString(), i]));

  // Validate availability against the database (never trust the browser)
  const problems = [];
  const lines = [];
  let totalCents = 0;
  requested.forEach((qty, id) => {
    const item = byId.get(id);
    if (!item || !item.isActive || !item.category || !item.category.isActive) {
      problems.push({ itemId: id, name: item ? item.name : undefined, reason: 'UNAVAILABLE' });
      return;
    }
    if (item.quantity <= 0) {
      problems.push({ itemId: id, name: item.name, reason: 'OUT_OF_STOCK' });
      return;
    }
    if (item.quantity < qty) {
      problems.push({ itemId: id, name: item.name, reason: 'INSUFFICIENT_STOCK' });
      return;
    }
    const subtotalCents = Math.round(item.price * 100) * qty;
    totalCents += subtotalCents;
    lines.push({
      item: item._id,
      itemNameSnapshot: item.name,
      unitPriceSnapshot: item.price,
      quantity: qty,
      subtotal: subtotalCents / 100
    });
  });
  if (problems.length) {
    throw createHttpError(409, 'Some items are not available in the requested quantity', 'ITEMS_UNAVAILABLE', problems);
  }

  const data = {
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    paymentMethod: payload.paymentMethod || 'cash_on_delivery',
    paymentStatus: (payload.paymentMethod || 'cash_on_delivery') === 'paymob' ? 'pending' : 'not_required',
    deliveryAddress: payload.deliveryAddress,
    customerNotes: payload.customerNotes || '',
    items: lines,
    totalAmount: totalCents / 100,
    currency: env.store.currency,
    status: 'opened'
  };
  if (payload.clientRequestId) data.clientRequestId = String(payload.clientRequestId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const order = await Order.create({ ...data, orderCode: generateOrderCode() });
      return { order: toCustomerSummary(order.toObject()), duplicate: false };
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.clientRequestId) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await Order.findOne({ clientRequestId: data.clientRequestId }).lean();
        if (existing) return { order: toCustomerSummary(existing), duplicate: true };
      }
      const isCodeCollision = err.code === 11000 && err.keyPattern && err.keyPattern.orderCode;
      if (!isCodeCollision) throw err;
    }
  }
  throw createHttpError(500, 'Could not generate a unique order code', 'ORDER_CODE_FAILED');
}

async function list({ search, status, page = 1, limit = 10 }) {
  const filter = {};
  if (status) filter.status = String(status);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ orderCode: rx }, { customerName: rx }, { customerPhone: rx }];
  }
  const [rows, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);
  return { rows: rows.map(toManagerOrder), meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getById(id) {
  const order = await Order.findById(id).lean();
  if (!order) throw createHttpError(404, 'Order not found', 'ORDER_NOT_FOUND');
  return toManagerOrder(order);
}

async function updateStatus(id, status) {
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).lean();
  if (!order) throw createHttpError(404, 'Order not found', 'ORDER_NOT_FOUND');
  return toManagerOrder(order);
}

async function updateNotes(id, managerNotes) {
  const order = await Order.findByIdAndUpdate(id, { managerNotes }, { new: true, runValidators: true }).lean();
  if (!order) throw createHttpError(404, 'Order not found', 'ORDER_NOT_FOUND');
  return toManagerOrder(order);
}

async function getDashboardStats() {
  const [activeItems, totalCategories, totalOrders, openedOrders, closedOrders, recentOrders] = await Promise.all([
    Item.countDocuments({ isActive: true }),
    Category.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: 'opened' }),
    Order.countDocuments({ status: 'closed' }),
    Order.find().sort({ createdAt: -1 }).limit(5).select('orderCode customerName customerPhone totalAmount currency status createdAt').lean()
  ]);
  return { activeItems, totalCategories, totalOrders, openedOrders, closedOrders, recentOrders };
}

module.exports = { createOrder, list, getById, updateStatus, updateNotes, getDashboardStats };
