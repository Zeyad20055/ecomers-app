const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Validation failed', details });
}

module.exports = { validate };
