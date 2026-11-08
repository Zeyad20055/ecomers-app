const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { authenticate, requireManager } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validator = require('../validators/auth.validator');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Try again later.' }
});

router.post('/login', loginLimiter, validator.login, validate, controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, requireManager, controller.me);

module.exports = router;
