require('dotenv').config();
const express = require('express');
const dbInitialization = require('./database/initialization/initialization');

const app = express();
const PORT = process.env.PORT;

async function startServer() {
  // create db tables upon server start
  const result = await dbInitialization.initializePostgresDatabase();
  if (!result) {
    // kill server before it starts if database doesn't connect or create.
    console.log('[SERVER START] There was an issue creating the database. Cancelling server start.');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
}

startServer();
