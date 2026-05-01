require('dotenv').config();
const { Pool } = require('pg');
const { log } = require('../utils/log');
const { LOG_PREFIXES } = require('../constants/constants');

const { DB_POOL } = LOG_PREFIXES;

let pool;

// function to get the postgres pool and work with the database
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
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

// function to close the postgres pool
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
    } catch (error) {
      log(DB_POOL, `UNABLE TO END POOL: ${error.message}`);
    }
  }
}

exports.getPostgresPool = getPostgresPool;
exports.closePool = closePool;
