const analysisDB = require('../database/analysis.database');
const awsUtil = require('../utils/aws');
const validation = require('../utils/validation');
const { JOB_STATUS } = require('../constants/constants');

async function processAnalysisRetrieval(data) {
    const { jobId } = data;
    
    // since there is only one value no separate validation process is needed
    if (!jobId) return { success: false, messsage: 'Invalid request. Ensure jobId is included in the request.'};

    const jobStatus = await analysisDB.retrieveAnalysisStatus(jobId);
    if(!jobStatus) return { success: false, message: 'There was an issue processing your request. Please try again later'};

    switch(jobStatus.status){
        case(JOB_STATUS.PENDING): 
            return { success: true, completed: false, message: 'Analysis has not been started yet.'};
        case(JOB_STATUS.IN_PROGRESS):
            return { success: true, completed: false, message: 'Analysis is still in progress.'};
        case(JOB_STATUS.FAILED):
            return {success: true, completed: false, message: 'There was an issue with the analysis process. Please submit again.' }
        default:
            break;
    }

    const jobResult = await analysisDB.retrieveAnalysisResult(jobId);
    if(!jobResult) return { success: false, message: 'There was an issue processing your request. Please try again later'};

    return {
        success: true,
        completed: true,
        message: 'Request was successful.',
        data: {
            jobId: jobResult.job_id,
            riskLevel: jobResult.risk_level,
            summary: jobResult.summary,
            issues: jobResult.issues_json,
            recommendations: jobResult.recommendations_json,
        }
    };
}

async function processAnalysisCreation(data) {
    const { schema, payload, requirements } = data;

    // validates the incoming request to ensure all fields were sent
    const isValidRequest = validation.validateAnalysisCreation(schema, payload, requirements);
    if(!isValidRequest) return { success: false, message: 'Invalid request. Ensure schema, payload, and requirements are included in the request.'};

    // creates the db record for the analysis
    const jobId = await analysisDB.createAnalysisRecord(schema, payload, requirements);
    if(!jobId) return { success: false, message: 'There was an issue processing your request. Please try again later.'};

    // invokes the lambda function asynchronously
    const lambdaResult = awsUtil.lambdaInvoker(schema, payload, requirements);
    if(!lambdaResult) return { success: false, message: 'There was an issue processing your request. Please try again later.'}

    // if no errors return try and the job ID
    return { success: true, message: `Your request was successful. Here is your job ID: ${jobId.job_id}. Use this to request your result.`, jobId: jobId.job_id};
}

exports.processAnalysisRetrieval = processAnalysisRetrieval;
exports.processAnalysisCreation = processAnalysisCreation;
