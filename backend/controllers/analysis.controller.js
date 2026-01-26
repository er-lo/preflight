const { LOG_PREFIXES } = require('../constants/constants')

async function getAnalysisRecord(req, res) {
  try {
    console.log(`${LOG_PREFIXES.GET_ANALYSIS} Starting Analysis Retrieval Process`);

    const results = {
      statusCode: 200,
      body: {
        data: {},
        message: 'success - GET',
      }
    };

    res.status(results.statusCode).json(results.body);
  } catch (error) {
    console.log(`${LOG_PREFIXES.GET_ANALYSIS} Error: ${error.message}`);

    const results = {
      statusCode: 500,
      body: {
        message: 'failure',
      }
    };
    
    res.status(results.statusCode).json(results.body);
  }
};

async function postAnalysisRecord(req, res) {
  try {
    console.log(`${LOG_PREFIXES.POST_ANALYSIS} Starting Analysis Process`);
    const results = {
      statusCode: 200,
      body: {
        data: {},
        message: 'success - POST',
      }
    };

    res.status(results.statusCode).json(results.body);
  } catch (error) {
    console.log(`${LOG_PREFIXES.GET_ANALYSIS} Error: ${error.message}`);
    const results = {
      statusCode: 500,
      body: {
        message: 'failure',
      }
    }

    res.status(results.statusCode).json(results.body);
  }
};

exports.getAnalysisRecord = getAnalysisRecord;
exports.postAnalysisRecord = postAnalysisRecord;