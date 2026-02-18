const fs = require('fs');
const dbHelper = require('../database.client');
const { LOG_PREFIXES } = require('../../constants/constants');
const { log } = require('../../utils/log');

const { DB_INIT } = LOG_PREFIXES;

async function initializePostgresDatabase() {
  const pool = await dbHelper.getPostgresPool();
  const client = await pool.connect();
  try {
    const migration = fs.readFileSync('./database/initialization/db-creation.sql', 'utf8');
    log(DB_INIT, 'STARTING DB SET UP');
    await client.query(migration);
    log(DB_INIT, 'DB SET UP COMPLETE');
    return true;
  } catch (error) {
    log(DB_INIT, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}


exports.initializePostgresDatabase = initializePostgresDatabase;