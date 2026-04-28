const apiSpecDB = require('../database/api-spec.database');
const awsUtil = require('../utils/aws');
const validation = require('../utils/validation');
const { log } = require('../utils/log');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');

const { GET_SPEC_CREATION, POST_SPEC_CREATION } = LOG_PREFIXES;

async function processOpenApiFromCurlRetrieval(query) {
  const { jobId } = query;

  log(GET_SPEC_CREATION, 'Performing request validation..');
  if (!jobId) {
    return {
      success: false,
      status: JOB_STATUS.FAILED,
      message: 'Invalid request. Ensure jobId is included in the request.',
    };
  }

  log(GET_SPEC_CREATION, `Attempting to retrieve job status for Job ID: ${jobId}..`);
  const job = await apiSpecDB.retrieveOpenApiFromCurlJob(jobId);
  if (!job) {
    return {
      success: false,
      status: JOB_STATUS.FAILED,
      message: 'There was an issue processing your request. Please try again later',
    };
  }

  switch (job.status) {
    case JOB_STATUS.PENDING:
      return { success: true, status: JOB_STATUS.PENDING, message: 'OpenAPI generation has not been started yet.' };
    case JOB_STATUS.IN_PROGRESS:
      return { success: true, status: JOB_STATUS.IN_PROGRESS, message: 'OpenAPI generation is still in progress.' };
    case JOB_STATUS.FAILED:
      return { success: true, status: JOB_STATUS.FAILED, message: 'There was an issue generating the OpenAPI. Please submit again.' };
    default:
      break;
  }

  log(GET_SPEC_CREATION, 'Job completed. Attempting to retrieve result..');
  const result = await apiSpecDB.retrieveOpenApiFromCurlResult(jobId);
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
      resultJson: result.result_json,
      resultYaml: result.result_yaml,
    },
  };
}

async function processOpenApiFromCurlCreation(body) {
  log(POST_SPEC_CREATION, 'Performing request validation..');
  if (!validation.validateOpenApiFromCurlBody(body)) {
    return {
      success: false,
      message:
        'Invalid request. Provide a non-empty curl string; optional expectedRequestBody and expectedResponseBody must be objects or omitted/null.',
    };
  }

  log(POST_SPEC_CREATION, 'Creating OpenAPI-from-cURL record in DB..');
  const job = await apiSpecDB.createOpenApiFromCurlJob(body);
  if (!job) {
    return { success: false, message: 'There was an issue processing your request. Please try again later.' };
  }

  log(POST_SPEC_CREATION, 'Kicking off lambda function for OpenAPI-from-cURL..');
  const lambdaResult = await awsUtil.lambdaInvoker(job.job_id, 'openapi_from_curl', body);
  if (!lambdaResult) {
    return { success: false, message: 'There was an issue processing your request. Please try again later.' };
  }

  return {
    success: true,
    message: `Your request was successful. Here is your job ID: ${job.job_id}. Use this to request your result.`,
    jobId: job.job_id,
  };
}

exports.processOpenApiFromCurlRetrieval = processOpenApiFromCurlRetrieval;
exports.processOpenApiFromCurlCreation = processOpenApiFromCurlCreation;
