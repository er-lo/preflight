function validateAnalysisCreation(schema, payload, requirements) {
  if (!schema || typeof schema != 'string') return false;
  if (!payload || typeof payload != 'string') return false;
  if (!requirements || typeof requirements != 'string') return false;
  return true;
}

function validateOpenApiFromCurlBody(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.curl !== 'string' || !body.curl.trim()) return false;
  if (typeof body.expectedRequestBody !== 'object' && body.expectedRequestBody != null) return false;
  if (typeof body.expectedResponseBody !== 'object' && body.expectedResponseBody != null) return false;
  return true;
}

function validateEndpointDataGuideBody(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.curl !== 'string' || !body.curl.trim()) return false;
  if (typeof body.dataGoal !== 'string' || !body.dataGoal.trim()) return false;
  if (typeof body.extraContext !== 'string' && body.extraContext != null) return false;
  return true;
}

exports.validateAnalysisCreation = validateAnalysisCreation;
exports.validateOpenApiFromCurlBody = validateOpenApiFromCurlBody;
exports.validateEndpointDataGuideBody = validateEndpointDataGuideBody;