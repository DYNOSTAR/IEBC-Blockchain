const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load .env from backend root explicitly so scripts work regardless of process cwd.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  return {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 5432),
    database: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
  };
}

const pool = new Pool(getDatabaseConfig());

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to PostgreSQL:', err);
  }
  console.log('✅ Connected to PostgreSQL successfully');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
