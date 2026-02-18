const analysisDB = require('../database/analysis.database');
const awsUtil = require('../utils/aws');
const validation = require('../utils/validation');
const { log } = require('../utils/log');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');

const { GET_ANALYSIS, POST_ANALYSIS } = LOG_PREFIXES;

async function processAnalysisRetrieval(data) {
  const { jobId } = data;

  // since there is only one value no separate validation process is needed
  log(GET_ANALYSIS, 'Performing request validation..');
  if (!jobId) 
    return {
      success: false,
      messsage: 'Invalid request. Ensure jobId is included in the request.',
    };

  // retrieve the job status. This will determine if we will pull the result.
  log(GET_ANALYSIS, `Attempting to retrieve job status for Job ID: ${jobId}..`)
  const jobStatus = await analysisDB.retrieveAnalysisStatus(jobId);
  if (!jobStatus)
    return {
      success: false,
      message: 'There was an issue processing your request. Please try again later',
    };

  switch (jobStatus.status) {
    case (JOB_STATUS.PENDING):
      return {
        success: true,
        completed: false,
        message: 'Analysis has not been started yet.',
      };
    case (JOB_STATUS.IN_PROGRESS):
      return {
        success: true,
        completed: false,
        message: 'Analysis is still in progress.',
      };
    case (JOB_STATUS.FAILED):
      return {
        success: true,
        completed: false,
        message: 'There was an issue with the analysis process. Please submit again.',
      }
    default:
      break;
  }

  // if the job is completed then we grab the result from the DB. 
  log(GET_ANALYSIS, `Analysis was completed. Attempting to retrieve result..`)
  const jobResult = await analysisDB.retrieveAnalysisResult(jobId);
  if (!jobResult)
    return {
      success: false,
      message: 'There was an issue processing your request. Please try again later',
    };

  return {
    success: true,
    completed: true,
    message: 'Request was successful.',
    data: {
      jobId: jobResult.job_id,
      riskLevel: jobResult.risk_level,
      summary: jobResult.summary,
      issues: jobResult.issues_json,
      recommendations: jobResult.recommendations_json,
    }
  };
}

async function processAnalysisCreation(data) {
  const { schema, payload, requirements } = data;

  // validates the incoming request to ensure all fields were sent
  log(POST_ANALYSIS, 'Performing request validation..');
  const isValidRequest = validation.validateAnalysisCreation(schema, payload, requirements);
  if (!isValidRequest)
    return {
      success: false,
      message: 'Invalid request. Ensure schema, payload, and requirements are included in the request.',
    };

  // creates the db record for the analysis
  log(POST_ANALYSIS, 'Creating analysis record in DB..');
  const jobId = await analysisDB.createAnalysisRecord(schema, payload, requirements);
  if (!jobId)
    return {
      success: false,
      message: 'There was an issue processing your request. Please try again later.',
    };

  // invokes the lambda function asynchronously
  // in development environment this will do nothing as I don't want to kick off a lambda everytime i'm testing locally
  log(POST_ANALYSIS, 'Kicking off lambda function for AI analysis..');
  const lambdaResult = awsUtil.lambdaInvoker(schema, payload, requirements);
  if (!lambdaResult)
    return {
      success: false,
      message: 'There was an issue processing your request. Please try again later.',
    };

  // if no errors return true and the job ID
  return {
    success: true,
    message: `Your request was successful. Here is your job ID: ${jobId.job_id}. Use this to request your result.`,
    jobId: jobId.job_id,
  };
}

exports.processAnalysisRetrieval = processAnalysisRetrieval;
exports.processAnalysisCreation = processAnalysisCreation;
