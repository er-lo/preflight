const analysisDB = require('../database/analysis.database');
const validation = require('../utils/validation');

async function processAnalysisCreation(data) {
    const { schema, payload, requirements } = data;

    // validates the incoming request to ensure all fields were sent
    const isValidRequest = validation.validateAnalysisCreation(schema, payload, requirements);
    if(!isValidRequest) return { success: false, message: 'Invalid request. Ensure schema, payload, and requirements are included in the request.'};

    // creates the db record for the analysis
    const jobId = await analysisDB.createAnalysisRecord(schema, payload, requirements);
    if(!jobId) return { success: false, message: 'Error: There was an issue processing your request. Please try again later.'};

    // TODO: send the job ID, along with the payload to lambda

    return { success: true, message: `Your request was successful. Here is your job ID: ${jobId.job_id}. Use this to request your result.`, jobId: jobId.job_id};
}

exports.processAnalysisCreation = processAnalysisCreation;