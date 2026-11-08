const router = require('express').Router();
const dashboardRouter = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/order.controller');
const { authenticate, requireManager } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validator = require('../validators/order.validator');

const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Too many orders submitted. Try again later.' }
});

// Public: submit an order request (there is no public endpoint to read orders)
router.post('/', createOrderLimiter, validator.create, validate, controller.create);

// Manager only
router.use(authenticate, requireManager);
router.get('/', validator.list, validate, controller.list);
router.get('/:id', validator.idParam, validate, controller.getOne);
router.patch('/:id/status', validator.updateStatus, validate, controller.updateStatus);
router.patch('/:id/notes', validator.updateNotes, validate, controller.updateNotes);

// GET /api/v1/dashboard/stats (manager only)
dashboardRouter.get('/stats', authenticate, requireManager, controller.stats);

module.exports = router;
module.exports.dashboardRouter = dashboardRouter;
