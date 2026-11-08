const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Manager = require('../models/Manager');
const { createHttpError } = require('./error.middleware');

function extractToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw createHttpError(401, 'Authentication required', 'UNAUTHORIZED');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw createHttpError(401, 'Session expired', 'TOKEN_EXPIRED');
      throw createHttpError(401, 'Invalid token', 'INVALID_TOKEN');
    }

    const manager = await Manager.findById(payload.sub);
    if (!manager) throw createHttpError(401, 'Invalid token', 'INVALID_TOKEN');
    req.manager = manager;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireManager(req, res, next) {
  if (!req.manager || req.manager.role !== 'manager') {
    return next(createHttpError(403, 'Forbidden', 'FORBIDDEN'));
  }
  return next();
}

// Public listing endpoints can serve the manager view (with inventory) only when
// the request explicitly asks for ?scope=manager AND carries a valid manager token.
function managerScope(req, res, next) {
  req.isManagerScope = false;
  if (req.query.scope !== 'manager') return next();
  return authenticate(req, res, (err) => {
    if (err) return next(err);
    req.isManagerScope = true;
    return requireManager(req, res, next);
  });
}

module.exports = { authenticate, requireManager, managerScope };
