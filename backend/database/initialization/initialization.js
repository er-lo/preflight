const fs = require('fs');
const dbHelper = require('../database')
const { LOG_PREFIXES } = require('../../constants/constants')

async function initializePostgresDatabase() {
  try {
    const migration = fs.readFileSync('./database/initialization/db-creation.sql', 'utf8');
    const pool = await dbHelper.getPostgresPool();
    const client = await pool.connect();

    console.log(`${LOG_PREFIXES.DB_INIT} STARTING DB SET UP`)
    await client.query(migration);
    console.log(`${LOG_PREFIXES.DB_INIT} DB SET UP COMPLETE`)
    return true;
  } catch (error) {
    console.log(`${LOG_PREFIXES.DB_INIT} Error: ${error.message}`);
    return false;
  } finally {
    dbHelper.closePool();
  }
}


exports.initializePostgresDatabase = initializePostgresDatabase;