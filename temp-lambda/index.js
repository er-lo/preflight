require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

const aiRouter = require('./routes/ai.router');
const { log } = require('./utils/log');
const { LOG_PREFIXES } = require('./constants/constants');

const { SERVER_START } = LOG_PREFIXES;

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

app.use('/ai/', aiRouter);

async function startServer() {
  app.listen(PORT, () => {
    log(SERVER_START, `Server is running on port: ${PORT}`);
  });
}

// this was a temporary express api that I created to test the AI service locally
// I created this to avoid running up an aws bill because i don't like spending money
// this should be up to date ish for the requests
// i don't feel like commenting everything here just know that a request is made here and it processes
// and calls the openai service to get a result 

startServer();
