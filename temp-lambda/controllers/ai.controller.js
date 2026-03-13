const { LOG_PREFIXES, JOB_STATUS } = require('../constants/constants');
const aiService = require('../service/ai.service');
const { log } = require('../utils/log');

const { START_ANALYSIS } = LOG_PREFIXES;

async function startAnalysis(req, res) {
  try {
    log(START_ANALYSIS, `Incoming Request Body: ${JSON.stringify(req.body)}`)
    log(START_ANALYSIS, `Starting AI Analysis`)


    const result = await aiService.processDatabaseFunctions(req.body);

    aiService.processAIAnalysis(req.body);

    if (!result.success) {
      const results = {
        statusCode: 500,
        body: {
          message: result.message,
        }
      }

      res.status(results.statusCode).json(results.body);
    }

    const results = {
      statusCode: 200,
      body: {
        message: result.message,
        recordId: result?.recordId
      }
    };

    res.status(results.statusCode).json(results.body);
  } catch (error) {
    log(START_ANALYSIS, `Error: ${error.message}`)

    const results = {
      statusCode: 500,
      body: {
        message: `Error: ${error.message}`,
      }
    };

    res.status(results.statusCode).json(results.body);
  }
};

exports.startAnalysis = startAnalysis;
