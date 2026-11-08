const { body } = require('express-validator');

const login = [
  body('email').isString().withMessage('Email is required').trim().toLowerCase().isEmail().withMessage('Invalid email'),
  body('password').isString().withMessage('Password is required').isLength({ min: 1, max: 200 }).withMessage('Password is required')
];

module.exports = { login };
