const analysisDb = require('../db/analysisDb');
const openApiFromCurlDb = require('../db/openApiFromCurlDb');
const endpointGuideDb = require('../db/endpointGuideDb');
const { log } = require('../utils/log');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');
const { analysisPrompt, openapiFromCurlPrompt, endpointGuidePrompt } = require('../constants/prompts');
const openAiUtil = require('../utils/openai');

async function processAnalysisJob(body) {
  log(LOG_PREFIXES.AI_ANALYSIS, `Processing analysis job ${body.jobId}`);
  const { jobId, schema, payload, requirements } = body;
  const jobRecord = await analysisDb.createAnalysisJobRecord(jobId);
  if (!jobRecord) {
    log(LOG_PREFIXES.AI_ANALYSIS, `Failed to create job record for ${jobId}`);
    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.FAILED);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }

  try {
    log(LOG_PREFIXES.AI_ANALYSIS, `Updating job status to in-progress for job ${jobId}`)
    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.IN_PROGRESS);

    log(LOG_PREFIXES.AI_ANALYSIS, `Starting OpenAI Call`);
    const prompt = analysisPrompt(schema, payload, requirements);
    const response = await openAiUtil.callOpenAi(prompt);
    log(LOG_PREFIXES.AI_ANALYSIS, `OpenAI Response: ${JSON.stringify(response)}`)
    const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';
    log(LOG_PREFIXES.AI_ANALYSIS, `Output Text: ${outputText}`)

    let parsed;
    try {
      parsed = outputText ? JSON.parse(outputText) : null;
    } catch {
      parsed = null;
    }

    const riskLevel = parsed?.riskLevel ?? 'LOW';
    const summary = parsed?.summary ?? 'Local run completed.';
    const issuesJson = parsed?.issues ?? [];
    const recommendationsJson = parsed?.recommendations ?? [];

    log(LOG_PREFIXES.AI_ANALYSIS, `Analysis complete. Saving results for job ${jobId}`);
    await analysisDb.updateAnalysisResult(jobId, riskLevel, summary, issuesJson, recommendationsJson);

    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.COMPLETED);
    return { success: true, message: 'Analysis job processed.', recordId: jobId };
  } catch (err) {
    log(LOG_PREFIXES.AI_ANALYSIS, `Error: ${err.message}`);
    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.FAILED);
    throw err;
  }
}

async function processOpenApiFromCurlJob(body) {
  log(LOG_PREFIXES.OPENAPI_FROM_CURL, `Processing openapi from curl job ${body.jobId}`);
  const { jobId, curl, expectedRequestBody, expectedResponseBody } = body;
  const resultRecord = await openApiFromCurlDb.createOpenApiFromCurlJobRecord(jobId);
  if (!resultRecord) {
    log(LOG_PREFIXES.OPENAPI_FROM_CURL, `Failed to create job record for ${jobId}`);
    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.FAILED);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }


  try {
    log(LOG_PREFIXES.OPENAPI_FROM_CURL, `Updating job status to in-progress for job ${jobId}`)
    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.IN_PROGRESS);

    log(LOG_PREFIXES.AI_ANALYSIS, `Starting OpenAI Call`);
    const prompt = openapiFromCurlPrompt(curl, expectedRequestBody, expectedResponseBody);
    const response = await openAiUtil.callOpenAi(prompt);
    log(LOG_PREFIXES.AI_ANALYSIS, `OpenAI Response: ${JSON.stringify(response)}`)
    const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';
    log(LOG_PREFIXES.AI_ANALYSIS, `Output Text: ${outputText}`)

    let parsed;
    try {
      parsed = outputText ? JSON.parse(outputText) : null;
    } catch {
      parsed = null;
    }

    const resultJson = parsed?.json ?? null;
    const resultYaml = parsed?.yaml ?? null;

    log(LOG_PREFIXES.OPENAPI_FROM_CURL, `Analysis complete. Saving results for job ${jobId}`);
    await openApiFromCurlDb.updateOpenApiFromCurlResult(jobId, resultJson, resultYaml);

    log(LOG_PREFIXES.OPENAPI_FROM_CURL, `Updating job status to completed for job ${jobId}`);
    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.COMPLETED);
    log(LOG_PREFIXES.OPENAPI_FROM_CURL, `OpenAPI-from-cURL job processed successfully for job ${jobId}`);

    return { success: true, message: 'OpenAPI-from-cURL job processed.', recordId: jobId };

  } catch (error) {
    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.FAILED);
    log(LOG_PREFIXES.OPENAPI_FROM_CURL, `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

async function processEndpointGuideJob(body) {
  log(LOG_PREFIXES.ENDPOINT_GUIDE, `Processing endpoint guide job ${body.jobId}`);
  const { jobId, apiDoc, dataGoal, extraContext } = body;
  const resultRecord = await endpointGuideDb.createEndpointGuideJobRecord(jobId);
  if (!resultRecord) {
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Failed to create job record for ${jobId}`);
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.FAILED);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }


  try {
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Updating job status to in-progress for job ${jobId}`);
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.IN_PROGRESS);

    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Starting OpenAI Call`);
    const prompt = endpointGuidePrompt(apiDoc, dataGoal, extraContext);
    const response = await openAiUtil.callOpenAi(prompt);
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `OpenAI Response: ${JSON.stringify(response)}`)
    const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Output Text: ${outputText}`)

    let parsed;
    try {
      parsed = outputText ? JSON.parse(outputText) : null;
    } catch {
      parsed = null;
    }

    const jobResult = parsed?.endpointGuide ?? null;

    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Analysis complete. Saving results for job ${jobId}`);
    await endpointGuideDb.updateEndpointGuideResult(jobId, jobResult);
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Updating job status to completed for job ${jobId}`);
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.COMPLETED);
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Endpoint-guide job processed successfully for job ${jobId}`);

    return { success: true, message: 'Endpoint-guide job processed.', recordId: jobId };
  } catch (error) {
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.FAILED);
    log(LOG_PREFIXES.ENDPOINT_GUIDE, `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

exports.processAnalysisJob = processAnalysisJob;
exports.processOpenApiFromCurlJob = processOpenApiFromCurlJob;
exports.processEndpointGuideJob = processEndpointGuideJob;
