require('dotenv').config();
const { Pool } = require('pg');

let pool;

async function getPostgresPool() {
  const user = process.env.PG_USER;
  const password = process.env.PG_PASS;
  const host = process.env.PG_HOST;
  const port = +process.env.PG_PORT;
  const database = process.env.PG_DB;

  if (!pool) {
    pool = new Pool({
      user,
      password,
      host,
      port,
      database,
    });
  }

  return pool;
}

async function closePool() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
    } catch (error) {
      console.log(`UNABLE TO END POOL: ${error.message}`);
    }
  }
}

exports.getPostgresPool = getPostgresPool;
exports.closePool = closePool;
