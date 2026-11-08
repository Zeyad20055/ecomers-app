const router = require('express').Router();
const controller = require('../controllers/category.controller');
const { authenticate, requireManager, managerScope } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validator = require('../validators/category.validator');

// Public (active categories only). With ?scope=manager and a valid manager token: all categories.
router.get('/', managerScope, validator.list, validate, controller.list);
router.get('/:id', managerScope, validator.idParam, validate, controller.getOne);

// Manager only
router.post('/', authenticate, requireManager, validator.create, validate, controller.create);
router.patch('/:id', authenticate, requireManager, validator.update, validate, controller.update);
router.delete('/:id', authenticate, requireManager, validator.idParam, validate, controller.remove);

module.exports = router;
