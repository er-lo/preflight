const fs = require('fs');
const dbHelper = require('../database')

async function initializePostgresDatabase() {
  try {
    const migration = fs.readFileSync('./database/initialization/db-creation.sql', 'utf8');
    const pool = await dbHelper.getPostgresPool();
    const client = await pool.connect();

    console.log('[DB INITIALIZATION] STARTING DB SET UP')
    await client.query(migration);
    console.log('[DB INITIALIZATION] DB SET UP COMPLETE')
    return true;
  } catch (error) {
    console.log(`[DB INITIALIZATION] Error: ${error.message}`);
    return false;
  } finally {
    dbHelper.closePool();
  }
}


exports.initializePostgresDatabase = initializePostgresDatabase;