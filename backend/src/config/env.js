const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('replace_with')) {
  throw new Error('JWT_SECRET is missing. Copy backend/.env.example to backend/.env and set a long random secret.');
}
if (nodeEnv === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:4200').split(',').map((u) => u.trim()),
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || ''
  },
  paymob: {
    baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com',
    secretKey: process.env.PAYMOB_SECRET_KEY || '',
    publicKey: process.env.PAYMOB_PUBLIC_KEY || '',
    integrationId: process.env.PAYMOB_INTEGRATION_ID ? Number(process.env.PAYMOB_INTEGRATION_ID) : 0,
    hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
    webhookUrl: process.env.PAYMOB_WEBHOOK_URL || '',
    redirectUrl: process.env.PAYMOB_REDIRECT_URL || 'http://localhost:4200/order-success'
  },
  manager: {
    name: process.env.MANAGER_NAME || 'Store Manager',
    email: process.env.MANAGER_EMAIL,
    password: process.env.MANAGER_PASSWORD
  },
  store: {
    name: process.env.STORE_NAME || 'My Store',
    phone: process.env.STORE_PHONE || '',
    currency: process.env.STORE_CURRENCY || 'EGP'
  }
};
