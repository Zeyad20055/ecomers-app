const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const app = require('./app');

async function start() {
  try {
    await connectDatabase();
    app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`));
  } catch (err) {
    console.error('Failed to start the server:', err.message);
    process.exit(1);
  }
}

start();
