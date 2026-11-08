const router = require('express').Router();
const controller = require('../controllers/note.controller');
const { authenticate, requireManager } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validator = require('../validators/note.validator');

// Every notes endpoint is manager-only.
router.use(authenticate, requireManager);

router.get('/', validator.list, validate, controller.list);
router.post('/', validator.create, validate, controller.create);
router.patch('/:noteId', validator.update, validate, controller.update);
router.delete('/:noteId', validator.noteIdParam, validate, controller.remove);

module.exports = router;
