function validateAnalysisCreation(schema, payload, requirements) {
  if (!schema || typeof schema != 'string') {
    return false;
  }

  if (!payload || typeof payload != 'string') {
    return false;
  }

  if (!requirements || typeof requirements != 'string') {
    return false;
  }

  return true;
}

exports.validateAnalysisCreation = validateAnalysisCreation;