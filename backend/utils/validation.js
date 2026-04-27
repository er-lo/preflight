function validateAnalysisCreation(schema, payload, requirements) {
  if (!schema || typeof schema != 'string') return false;
  if (!payload || typeof payload != 'string') return false;
  if (!requirements || typeof requirements != 'string') return false;
  return true;
}

function validateOpenApiFromCurlBody(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.curl !== 'string' || !body.curl.trim()) return false;
  if (body.expectedRequestBody != null && typeof body.expectedRequestBody !== 'object') return false;
  if (body.expectedResponseBody != null && typeof body.expectedResponseBody !== 'object') return false;
  if (body.endpointSummary != null && typeof body.endpointSummary !== 'string') return false;
  return true;
}

function validateEndpointDataGuideBody(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.openApiFormat !== 'string' || !body.openApiFormat.trim()) return false;
  if (typeof body.openApiSpec !== 'string' || !body.openApiSpec.trim()) return false;
  if (typeof body.dataGoal !== 'string' || !body.dataGoal.trim()) return false;
  if (body.extraContext != null && typeof body.extraContext !== 'string') return false;
  return true;
}

exports.validateAnalysisCreation = validateAnalysisCreation;
exports.validateOpenApiFromCurlBody = validateOpenApiFromCurlBody;
exports.validateEndpointDataGuideBody = validateEndpointDataGuideBody;