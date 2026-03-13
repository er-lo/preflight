const analysisDB = require('../database/analysis.database');
const aiUtil = require('../utils/openai');
const { log } = require('../utils/log');

async function processDatabaseFunctions(data) {
  const { jobId } = data;

  const resultRecord = await analysisDB.createResultRecord(jobId.job_id);
  if (!resultRecord)
    return {
      success: false,
      message: 'There was an issue processing the request. Please try again later.'
    };

  await analysisDB.updateJobRecordStarted(jobId.job_id);

  return {
    success: true,
    message: 'Analysis is currently being processed by the AI agent.',
    recordId: resultRecord.result_id
  }
}

async function processAIAnalysis(data) {
  const { schema, payload, requirements } = data;

  try {
    const result = await aiUtil.callOpenAi(schema, payload, requirements);
    console.log(result);
  } catch(error) {

  }

}

exports.processDatabaseFunctions = processDatabaseFunctions;
exports.processAIAnalysis = processAIAnalysis;
