const endpointGuideDB = require('../database/endpoint-guide.database');
const awsUtil = require('../utils/aws');
const validation = require('../utils/validation');
const { log } = require('../utils/log');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');

const { GET_ENDPOINT_GUIDE, POST_ENDPOINT_GUIDE } = LOG_PREFIXES;

async function processEndpointGuideRetrieval(query) {
  const { jobId } = query;

  log(GET_ENDPOINT_GUIDE, 'Performing request validation..');
  if (!jobId) {
    return {
      success: false,
      status: JOB_STATUS.FAILED,
      message: 'Invalid request. Ensure jobId is included in the request.',
    };
  }

  log(GET_ENDPOINT_GUIDE, `Attempting to retrieve job status for Job ID: ${jobId}..`);
  const job = await endpointGuideDB.retrieveEndpointGuideJob(jobId);
  if (!job) {
    return {
      success: false,
      status: JOB_STATUS.FAILED,
      message: 'There was an issue processing your request. Please try again later',
    };
  }

  switch (job.status) {
    case JOB_STATUS.PENDING:
      return { success: true, status: JOB_STATUS.PENDING, message: 'Endpoint guide has not been started yet.' };
    case JOB_STATUS.IN_PROGRESS:
      return { success: true, status: JOB_STATUS.IN_PROGRESS, message: 'Endpoint guide is still in progress.' };
    case JOB_STATUS.FAILED:
      return { success: true, status: JOB_STATUS.FAILED, message: 'There was an issue generating the endpoint guide. Please submit again.' };
    default:
      break;
  }

  log(GET_ENDPOINT_GUIDE, 'Job completed. Attempting to retrieve result..');
  const result = await endpointGuideDB.retrieveEndpointGuideResult(jobId);
  if (!result) {
    return {
      success: false,
      status: JOB_STATUS.FAILED,
      message: 'There was an issue processing your request. Please try again later',
    };
  }

  return {
    success: true,
    completed: true,
    message: 'Request was successful.',
    status: JOB_STATUS.COMPLETED,
    data: {
      jobId: result.job_id,
      guide: result.guide_json,
    },
  };
}

async function processEndpointGuideCreation(body) {
  log(POST_ENDPOINT_GUIDE, 'Performing request validation..');
  if (!validation.validateEndpointDataGuideBody(body)) {
    return {
      success: false,
      message: 'Invalid request. Provide openApiFormat ("json" or "yaml"), a non-empty openApiSpec, and a non-empty dataGoal.',
    };
  }

  log(POST_ENDPOINT_GUIDE, 'Creating endpoint-guide record in DB..');
  const job = await endpointGuideDB.createEndpointGuideJob(body);
  if (!job) {
    return { success: false, message: 'There was an issue processing your request. Please try again later.' };
  }

  log(POST_ENDPOINT_GUIDE, 'Kicking off lambda function for endpoint guide..');
  const lambdaResult = await awsUtil.lambdaInvoker(job.job_id, 'endpoint_guide', body);
  if (!lambdaResult) {
    return { success: false, message: 'There was an issue processing your request. Please try again later.' };
  }

  return {
    success: true,
    message: `Your request was successful. Here is your job ID: ${job.job_id}. Use this to request your result.`,
    jobId: job.job_id,
  };
}

exports.processEndpointGuideRetrieval = processEndpointGuideRetrieval;
exports.processEndpointGuideCreation = processEndpointGuideCreation;

