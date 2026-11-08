const env = require('../config/env');

// Small factory used by controllers, services and middlewares to raise HTTP errors.
function createHttpError(status, message, code, details) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}

function notFound(req, res, next) {
  next(createHttpError(404, 'Route not found', 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
  let message = err.message;
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    code = field === 'name' ? 'CATEGORY_NAME_EXISTS' : 'DUPLICATE_VALUE';
    message = 'A record with the same unique value already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON body';
  } else if (/MongooseServerSelectionError|MongoNetworkError|MongoServerSelectionError/.test(err.name)) {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Service temporarily unavailable';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProduction || status === 500) message = 'Something went wrong. Please try again later.';
    details = undefined;
  }

  const body = { success: false, code, message };
  if (details) body.details = details;
  if (!env.isProduction && status >= 500) body.debug = err.message;
  res.status(status).json(body);
}

module.exports = { createHttpError, notFound, errorHandler };
