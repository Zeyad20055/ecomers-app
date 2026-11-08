const env = require('../config/env');
const authService = require('../services/auth.service');

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
  path: '/'
});

async function login(req, res, next) {
  try {
    const { manager, token, expiresAt } = await authService.login(req.body.email, req.body.password);
    res.cookie('token', token, { ...cookieOptions(), maxAge: Math.max(expiresAt - Date.now(), 0) });
    res.json({ success: true, data: { manager, expiresAt } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('token', cookieOptions());
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.json({ success: true, data: { manager: req.manager.toJSON() } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me };
