const router = require('express').Router();
const controller = require('../controllers/order.controller');

// Paymob sends a server-to-server POST; the controller verifies its HMAC before updates.
router.post('/paymob/webhook', controller.paymobWebhook);

module.exports = router;
