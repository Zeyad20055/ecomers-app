const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Manager = require('../models/Manager');
const { createHttpError } = require('../middlewares/error.middleware');

// Used to keep response time similar when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

async function login(email, password) {
  const manager = await Manager.findOne({ email: String(email).toLowerCase() }).select('+password');
  const hash = manager ? manager.password : DUMMY_HASH;
  const ok = await bcrypt.compare(String(password), hash);
  if (!manager || !ok) throw createHttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  const token = jwt.sign({ sub: manager._id.toString(), role: manager.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
  const { exp } = jwt.decode(token);
  return { manager: manager.toJSON(), token, expiresAt: exp * 1000 };
}

module.exports = { login };
