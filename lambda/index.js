require('dotenv').config();

function safeJsonParse(value) {
  if (typeof value !== 'string') return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, value: null };
  }
}

function normalizeLambdaEvent(event) {
  if (event && typeof event === 'object' && !Buffer.isBuffer(event)) return event;

  const parsed = safeJsonParse(event);
  if (parsed.ok && parsed.value && typeof parsed.value === 'object') return parsed.value;

  return {};
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  };
}



async function handler(event, context) {
  console.log(`ENVIRONMENT: ${process.env.NODE_ENVIRONMENT ?? '(unset)'}`);

  if (context && typeof context === 'object') {
    context.callbackWaitsForEmptyEventLoop = true;
  }

  const data = normalizeLambdaEvent(event);
  const { jobType } = data ?? {};

  try {
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

    // Backend uses InvocationType: 'Event' (async), so it's fine to return after completion here.
    return response(202, { success: true, message: 'Job processed.' });
  } catch (error) {
    console.error('Lambda error:', error);
    return response(500, { success: false, message: error?.message ?? 'Internal error.' });
  }
}

exports.handler = handler;