const analysisDB = require('../database/analysis.database');
const apiSpecDB = require('../database/api-spec.database');
const endpointGuideDB = require('../database/endpoint-guide.database');
const aiUtil = require('../utils/openai');
const { log } = require('../utils/log');
const { JOB_STATUS } = require('../constants/constants');
const { analysisPrompt, openapiFromCurlPrompt, endpointGuidePrompt } = require('../constants/prompts');

async function processAnalysisJob(body) {
  const { jobId, schema, payload, requirements } = body;
  const resultRecord = await analysisDB.createResultRecord(jobId);
  if (!resultRecord) {
    await analysisDB.updateJobRecordFailed(jobId);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }

  await analysisDB.updateJobRecordStarted(jobId);

  try {
    // If you don't want to call OpenAI during local runs, set USE_OPENAI=false.
    if (String(process.env.USE_OPENAI ?? 'false').toLowerCase() === 'true') {
      const prompt = analysisPrompt(schema, payload, requirements);
      const response = await aiUtil.callOpenAi(prompt);
      const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';

      // If the model returns JSON text, try parse it; otherwise store a basic fallback.
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

      await analysisDB.updateResultRecord(
        resultRecord.result_id,
        jobId,
        riskLevel,
        summary,
        issuesJson,
        recommendationsJson,
      );
    } else {
      // Fast stub for local polling UX
      await analysisDB.updateResultRecord(
        resultRecord.result_id,
        jobId,
        'LOW',
        'Local stub: analysis completed.',
        [],
        [{ priority: 1, recommendation: 'Set USE_OPENAI=true to run real inference locally.' }],
      );
    }

    await analysisDB.updateJobRecordCompleted(jobId);

    return {
      success: true,
      message: 'Analysis is currently being processed by the AI agent.',
      recordId: resultRecord.result_id,
    };
  } catch (error) {
    await analysisDB.updateJobRecordFailed(jobId);
    log('[AI ANALYSIS]', `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

async function processOpenApiFromCurlJob(body) {
  const { jobId, curl, expectedRequestBody, expectedResponseBody } = body;
  const resultRecord = await apiSpecDB.createResultRecord(jobId);
  if (!resultRecord) {
    await apiSpecDB.updateJobRecordFailed(jobId);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }

  await apiSpecDB.updateJobRecordStarted(jobId);

  try {
    // If you don't want to call OpenAI during local runs, set USE_OPENAI=false.
    if (String(process.env.USE_OPENAI ?? 'false').toLowerCase() === 'true') {
      const prompt = openapiFromCurlPrompt(curl, expectedRequestBody, expectedResponseBody);
      const response = await aiUtil.callOpenAi(prompt);
      const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';

      let parsed;
      try {
        parsed = outputText ? JSON.parse(outputText) : null;
      } catch {
        parsed = null;
      }

      const resultJson = parsed?.json ?? null;
      const resultYaml = parsed?.yaml ?? null;

      await apiSpecDB.updateResultRecord(jobId, resultJson, resultYaml);

      await apiSpecDB.updateJobRecordCompleted(jobId);

      return { success: true, message: 'OpenAPI-from-cURL job processed (local stub).', recordId: jobId };
    } else {
      // Fast stub for local polling UX
      await apiSpecDB.updateResultRecord(jobId, {}, null);

      await apiSpecDB.updateJobRecordCompleted(jobId);

      return { success: true, message: 'OpenAPI-from-cURL job processed (local stub).', recordId: jobId };
    }

  } catch (error) {
    await apiSpecDB.updateJobRecordFailed(jobId);
    log('[AI OPENAPI_FROM_CURL]', `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

async function processEndpointGuideJob(body) {
  const { jobId, apiDoc, dataGoal, extraContext } = body;
  const resultRecord = await endpointGuideDB.createResultRecord(jobId);
  if (!resultRecord) {
    await endpointGuideDB.updateJobRecordFailed(jobId);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }

  await endpointGuideDB.updateJobRecordStarted(jobId);

  try {
    // If you don't want to call OpenAI during local runs, set USE_OPENAI=false.
    if (String(process.env.USE_OPENAI ?? 'false').toLowerCase() === 'true') {
      const prompt = endpointGuidePrompt(apiDoc, dataGoal, extraContext);
      const response = await aiUtil.callOpenAi(prompt);
      const outputText = response?.output?.[0]?.content?.[0]?.text ?? '';

      let parsed;
      try {
        parsed = outputText ? JSON.parse(outputText) : null;
      } catch {
        parsed = null;
      }

      const jobResult = parsed?.endpointGuide ?? null;

      await endpointGuideDB.updateResultRecord(jobId, jobResult);

      await endpointGuideDB.updateJobRecordCompleted(jobId);

      return { success: true, message: 'OpenAPI-from-cURL job processed (local stub).', recordId: jobId };
    } else {
      // Fast stub for local polling UX
      await endpointGuideDB.updateResultRecord(jobId, null);

      await endpointGuideDB.updateJobRecordCompleted(jobId);

      return { success: true, message: 'OpenAPI-from-cURL job processed (local stub).', recordId: jobId };
    }

  } catch (error) {
    await endpointGuideDB.updateJobRecordFailed(jobId);
    log('[AI OPENAPI_FROM_CURL]', `Error: ${error.message}`);
    return { success: false, message: 'There was an issue processing the request. Please try again later.' };
  }
}

async function processJob(data) {
  const { jobId, jobType } = data ?? {};
  if (!jobId || typeof jobId !== 'number') {
    return { success: false, message: 'Invalid request: jobId (number) is required.' };
  }

  // mirror the payload from backend/utils/aws.js
  switch (jobType) {
    case 'analysis':
      return processAnalysisJob(data);
    case 'openapi_from_curl':
      return processOpenApiFromCurlJob(data);
    case 'endpoint_guide':
      return processEndpointGuideJob(data);
    default:
      return { success: false, message: `Invalid request: unknown jobType "${jobType}".` };
  }
}

exports.processJob = processJob;
