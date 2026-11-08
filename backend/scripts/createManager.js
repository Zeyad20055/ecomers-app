const env = require('../src/config/env');
const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const Manager = require('../src/models/Manager');

async function run() {
  const { name, email, password } = env.manager;
  if (!email || !password || password.startsWith('replace_with')) {
    throw new Error('Set MANAGER_EMAIL and a strong MANAGER_PASSWORD in backend/.env first.');
  }
  if (password.length < 8) throw new Error('MANAGER_PASSWORD must be at least 8 characters.');

  await connectDatabase();

  const existing = await Manager.countDocuments();
  if (existing > 0) {
    console.log('A manager account already exists. Only one manager is supported. Nothing was changed.');
    return;
  }

  await Manager.create({ name, email, password, role: 'manager' });
  console.log(`Manager account created for ${email}.`);
  if (!env.isProduction) console.log('You can now log in at /manager/login.');
}

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
