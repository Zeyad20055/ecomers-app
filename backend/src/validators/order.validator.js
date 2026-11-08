const { body, param, query } = require('express-validator');

const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const create = [
  body('customerName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Full name is required'),
  body('customerPhone').isString().trim().matches(/^\+?[0-9\s\-()]{7,20}$/).withMessage('Invalid phone number'),
  body('customerEmail').isString().trim().isLength({ min: 1, max: 150 }).toLowerCase().isEmail().withMessage('Invalid email'),
  body('paymentMethod').optional().isIn(['cash_on_delivery', 'paymob']).withMessage('Invalid payment method'),
  body('deliveryAddress').isString().trim().isLength({ min: 5, max: 500 }).withMessage('Delivery address is required'),
  body('customerNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 1000 }),
  body('clientRequestId').isString().trim().isLength({ min: 8, max: 64 }),
  body('items').isArray({ min: 1, max: 50 }).withMessage('At least one item is required'),
  body('items.*.item').isMongoId().withMessage('Invalid item id'),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99').toInt()
];

const list = [
  query('search').optional().isString().isLength({ max: 100 }),
  query('status').optional().isIn(['opened', 'closed']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const updateStatus = [...idParam, body('status').isIn(['opened', 'closed']).withMessage('Status must be opened or closed')];

const updateNotes = [
  ...idParam,
  body('managerNotes').isString().withMessage('Notes must be text').trim().isLength({ max: 2000 }).withMessage('Notes are too long (max 2000)')
];

module.exports = { idParam, create, list, updateStatus, updateNotes };
