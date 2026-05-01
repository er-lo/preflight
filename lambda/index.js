require('dotenv').config();

const { processAnalysisJob, processOpenApiFromCurlJob, processEndpointGuideJob } = require('./src/jobs');

// function to safely parse the body of the event from the api gateway
function safeJsonParse(value) {
  if (typeof value !== 'string') return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, value: null };
  }
}

// function to decode the body of the event from the api gateway
function decodeFunctionUrlBody(event) {
  if (!event || typeof event.body !== 'string') return null;

  let raw = event.body;
  if (event.isBase64Encoded) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }

  const parsed = safeJsonParse(raw);
  return parsed.ok && parsed.value && typeof parsed.value === 'object' ? parsed.value : null;
}

// function to normalize the event from the api gateway makes it easier to work with
function normalizeLambdaEvent(event) {
  if (Buffer.isBuffer(event)) {
    const parsed = safeJsonParse(event.toString('utf8'));
    return parsed.ok && parsed.value && typeof parsed.value === 'object' ? parsed.value : {};
  }

  if (event && typeof event === 'object') {
    const fromBody = decodeFunctionUrlBody(event);
    if (fromBody) return fromBody;

    if (typeof event.jobType === 'string' || typeof event.jobId !== 'undefined') {
      return event;
    }
  }

  if (typeof event === 'string') {
    const parsed = safeJsonParse(event);
    if (parsed.ok && parsed.value && typeof parsed.value === 'object') return parsed.value;
  }

  return {};
}

// function to return the response to the api gateway
function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  };
}

// entry point for the lambda function. 
// this is the function that is called when the lambda function is invoked.
// all three tools are processed here in one lambda for simplicity
async function handler(event, context) {
  console.log(`ENVIRONMENT: ${process.env.NODE_ENVIRONMENT ?? '(unset)'}`);

  if (context && typeof context === 'object') {
    context.callbackWaitsForEmptyEventLoop = true;
  }

  const data = normalizeLambdaEvent(event);
  const { jobType } = data ?? {};

  try {
    // process the job based on the job type
    switch (jobType) {
      case 'analysis': {
        await processAnalysisJob(data);
        break;
      }
      case 'openapi_from_curl': {
        await processOpenApiFromCurlJob(data);
        break;
      }
      case 'endpoint_guide': {
        await processEndpointGuideJob(data);
        break;
      }
      default: {
        return response(400, {
          success: false,
          message: `Invalid request: unknown jobType "${jobType}".`,
        });
      }
    }

    return response(202, { success: true, message: 'Job processed.' });
  } catch (error) {
    console.error('Lambda error:', error);
    return response(500, { success: false, message: error?.message ?? 'Internal error.' });
  }
}

exports.handler = handler;