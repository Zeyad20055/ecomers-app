const { body, param, query } = require('express-validator');

const imageRule = (chain) =>
  chain
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .matches(/^(https?:\/\/|\/)/)
    .withMessage('Image must be an http(s) URL or a site path');

const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const list = [
  query('search').optional().isString().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('active').optional().isIn(['true', 'false'])
];

const create = [
  body('name').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Name is required (max 80 characters)'),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  imageRule(body('image')),
  body('isActive').optional().isBoolean().toBoolean()
];

const update = [
  ...idParam,
  body('name').optional().isString().trim().isLength({ min: 1, max: 80 }).withMessage('Name cannot be empty (max 80 characters)'),
  body('description').optional({ values: 'null' }).isString().trim().isLength({ max: 500 }),
  body('image').optional({ values: 'null' }).isString().trim().isLength({ max: 2000 }).custom((v) => v === '' || /^(https?:\/\/|\/)/.test(v)).withMessage('Image must be an http(s) URL or a site path'),
  body('isActive').optional().isBoolean().toBoolean()
];

module.exports = { idParam, list, create, update };
