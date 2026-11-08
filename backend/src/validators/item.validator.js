const { body, param, query } = require('express-validator');

const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const list = [
  query('search').optional().isString().isLength({ max: 100 }),
  query('category').optional().isMongoId().withMessage('Invalid category'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'name']),
  query('featured').optional().isIn(['true', 'false']),
  query('active').optional().isIn(['true', 'false'])
];

const create = [
  body('name').isString().trim().isLength({ min: 1, max: 150 }).withMessage('Name is required (max 150 characters)'),
  body('description').isString().trim().isLength({ min: 1, max: 3000 }).withMessage('Description is required (max 3000 characters)'),
  body('price').isFloat({ min: 0, max: 100000000 }).withMessage('Price must be a non-negative number').toFloat(),
  body('quantity').isInt({ min: 0, max: 1000000 }).withMessage('Quantity must be a non-negative integer').toInt(),
  body('category').isMongoId().withMessage('A valid category is required'),
  body('image').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }).matches(/^(https?:\/\/|\/)/).withMessage('Image must be an http(s) URL or a site path'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean()
];

const update = [
  ...idParam,
  body('name').optional().isString().trim().isLength({ min: 1, max: 150 }),
  body('description').optional().isString().trim().isLength({ min: 1, max: 3000 }),
  body('price').optional().isFloat({ min: 0, max: 100000000 }).withMessage('Price must be a non-negative number').toFloat(),
  body('quantity').optional().isInt({ min: 0, max: 1000000 }).withMessage('Quantity must be a non-negative integer').toInt(),
  body('category').optional().isMongoId().withMessage('A valid category is required'),
  body('image').optional({ values: 'null' }).isString().trim().isLength({ max: 2000 }).custom((v) => v === '' || /^(https?:\/\/|\/)/.test(v)).withMessage('Image must be an http(s) URL or a site path'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean()
];

module.exports = { idParam, list, create, update };
