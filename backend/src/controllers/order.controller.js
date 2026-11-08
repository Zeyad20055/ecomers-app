const orderService = require('../services/order.service');
const emailService = require('../services/email.service');
const paymobService = require('../services/paymob.service');

async function create(req, res, next) {
  try {
    // Fail before persisting an order when the selected payment provider is not ready.
    if (req.body.paymentMethod === 'paymob') paymobService.assertConfigured();
    const { order, duplicate } = await orderService.createOrder(req.body);
    let checkoutUrl;
    if (order.paymentMethod === 'paymob') {
      checkoutUrl = await paymobService.createOrGetCheckoutUrl(order.orderCode);
    } else if (!duplicate) {
      try {
        await emailService.sendOrderConfirmation(order);
      } catch (err) {
        console.error(`Failed to send confirmation email for order ${order.orderCode}:`, err);
      }
    }
    res.status(duplicate ? 200 : 201).json({ success: true, data: order, ...(checkoutUrl ? { checkoutUrl } : {}) });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { rows, meta } = await orderService.list(req.query);
    res.json({ success: true, data: rows, meta });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    res.json({ success: true, data: await orderService.getById(req.params.id) });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json({ success: true, data: await orderService.updateStatus(req.params.id, req.body.status) });
  } catch (err) {
    next(err);
  }
}

async function updateNotes(req, res, next) {
  try {
    res.json({ success: true, data: await orderService.updateNotes(req.params.id, req.body.managerNotes) });
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    res.json({ success: true, data: await orderService.getDashboardStats() });
  } catch (err) {
    next(err);
  }
}

async function paymobWebhook(req, res, next) {
  try {
    const result = await paymobService.processWebhook(req.body, req.query.hmac);
    if (result.newlyPaid) {
      try {
        await emailService.sendOrderConfirmation(result.order);
      } catch (err) {
        console.error(`Failed to send paid-order confirmation email for order ${result.order.orderCode}:`, err);
      }
    }
    res.json({ success: true, accepted: result.accepted });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, updateStatus, updateNotes, stats, paymobWebhook };
