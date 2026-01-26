require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

const analysisRouter = require('./routes/analysis.router');
const dbInitialization = require('./database/initialization/initialization');
const { LOG_PREFIXES } = require('./constants/constants');

const app = express();
const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

app.use('/health', (req, res) => {
  const data = {
    online: true,
    uptime: process.uptime(),
    date: new Date(),
  };

  res.status(200).send(data);
});

app.use('/analysis/', analysisRouter);

async function startServer() {
  // create db tables upon server start
  const result = await dbInitialization.initializePostgresDatabase();
  if (!result) {
    // kill server before it starts if database doesn't connect or create.
    console.log(`${LOG_PREFIXES.SERVER_START} There was an issue creating the database. Cancelling server start.`);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`${LOG_PREFIXES.SERVER_START} Server is running on port: ${PORT}`);
  });
}

startServer();
