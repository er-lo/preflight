const { LOG_PREFIXES } = require('../constants/constants');
const analysisService = require('../service/analysis.service');

async function getAnalysis(req, res) {
  try {
    console.log(`${LOG_PREFIXES.GET_ANALYSIS} Starting Analysis Retrieval Process for record: ${req.query.id}`);

    const result = await analysisService.processAnalysisRetrieval(req.query);
    if(!result.success) {
      const results = {
        statusCode: 500,
        body: {
          message: result.message,
        }
      }

      res.status(results.statusCode).json(results.body);
    }

    // TODO: add checks for the different statuses

    const results = {
      statusCode: 200,
      body: {
        data: result.data,
        message: result.message,
      }
    };

    res.status(results.statusCode).json(results.body);
  } catch (error) {
    console.log(`${LOG_PREFIXES.GET_ANALYSIS} Error: ${error.message}`);

    const results = {
      statusCode: 500,
      body: {
        message: `Error: ${error.message}`,
      }
    };
    
    res.status(results.statusCode).json(results.body);
  }
};

async function createAnalysis(req, res) {
  try {
    console.log(`${LOG_PREFIXES.POST_ANALYSIS} Incoming Request Body: ${JSON.stringify(req.body)}`);
    console.log(`${LOG_PREFIXES.POST_ANALYSIS} Starting Analysis Process`);
    
    const result = await analysisService.processAnalysisCreation(req.body);
    if(!result.success) {
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
        data: {
          jobId: result.jobId
        },
        message: result.message,
      }
    };

    res.status(results.statusCode).json(results.body);
  } catch (error) {
    console.log(`${LOG_PREFIXES.POST_ANALYSIS} Error: ${error.message}`);
    const results = {
      statusCode: 500,
      body: {
        message: 'failure',
      }
    }

    res.status(results.statusCode).json(results.body);
  }
};

exports.getAnalysis = getAnalysis;
exports.createAnalysis = createAnalysis;