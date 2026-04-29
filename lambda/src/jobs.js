const analysisDb = require('./db/analysisDb');
const openApiFromCurlDb = require('./db/openApiFromCurlDb');
const endpointGuideDb = require('./db/endpointGuideDb');
const { JOB_STATUS } = require('./constants/constants');
const { analysisPrompt, openapiFromCurlPrompt, endpointGuidePrompt } = require('./constants/prompts');
const openAiUtil = require('./utils/openai');

async function processAnalysisJob(body) {
  const { jobId, schema, payload, requirements } = body;
  const jobRecord = await analysisDb.createAnalysisJobRecord(jobId);
  if (!jobRecord) {
    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.FAILED);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }

  try {
    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.IN_PROGRESS);

    const prompt = analysisPrompt(schema, payload, requirements);
    const response = await openAiUtil.callOpenAi(prompt);
    const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';

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

    const data = {
      riskLevel,
      summary,
      issuesJson,
      recommendationsJson,
    };

    await analysisDb.updateAnalysisResult(jobId, data);

    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.COMPLETED);
    return { success: true, message: 'Analysis job processed.', recordId: jobId };
  } catch (err) {
    log('[AI ANALYSIS]', `Error: ${err.message}`);
    await analysisDb.updateAnalysisJobStatus(jobId, JOB_STATUS.FAILED);
    throw err;
  }
}

async function processOpenApiFromCurlJob(body) {
  const { jobId, curl, expectedRequestBody, expectedResponseBody } = body;
  const resultRecord = await openApiFromCurlDb.createOpenApiFromCurlJobRecord(jobId);
  if (!resultRecord) {
    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.FAILED);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }


  try {
    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.IN_PROGRESS);

    const prompt = openapiFromCurlPrompt(curl, expectedRequestBody, expectedResponseBody);
    const response = await openAiUtil.callOpenAi(prompt);
    const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';

    let parsed;
    try {
      parsed = outputText ? JSON.parse(outputText) : null;
    } catch {
      parsed = null;
    }

    const resultJson = parsed?.json ?? null;
    const resultYaml = parsed?.yaml ?? null;

    await openApiFromCurlDb.updateOpenApiFromCurlResult(jobId, resultJson, resultYaml);

    await openApiFromCurlDb.updateOpenApiFromCurlJobStatus(jobId, JOB_STATUS.COMPLETED);

    return { success: true, message: 'OpenAPI-from-cURL job processed.', recordId: jobId };

  } catch (error) {
    await apiSpecDB.updateJobRecordFailed(jobId);
    log('[AI OPENAPI_FROM_CURL]', `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

async function processEndpointGuideJob(body) {
  const { jobId, apiDoc, dataGoal, extraContext } = body;
  const resultRecord = await endpointGuideDb.createEndpointGuideJobRecord(jobId);
  if (!resultRecord) {
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.FAILED);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }


  try {
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.IN_PROGRESS);

    const prompt = endpointGuidePrompt(apiDoc, dataGoal, extraContext);
    const response = await openAiUtil.callOpenAi(prompt);
    const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';

    let parsed;
    try {
      parsed = outputText ? JSON.parse(outputText) : null;
    } catch {
      parsed = null;
    }

    const jobResult = parsed?.endpointGuide ?? null;

    await endpointGuideDb.updateEndpointGuideResult(jobId, jobResult);

    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.COMPLETED);

    return { success: true, message: 'Endpoint-guide job processed.', recordId: jobId };
  } catch (error) {
    await endpointGuideDb.updateEndpointGuideJobStatus(jobId, JOB_STATUS.FAILED);
    log('[AI ENDPOINT_GUIDE]', `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

exports.processAnalysisJob = processAnalysisJob;
exports.processOpenApiFromCurlJob = processOpenApiFromCurlJob;
exports.processEndpointGuideJob = processEndpointGuideJob;
