const apiSpecService = require('../service/api-spec.service');
const { log } = require('../utils/log');
const { LOG_PREFIXES } = require('../constants/constants');

const { GET_SPEC_CREATION, POST_SPEC_CREATION } = LOG_PREFIXES;

async function getOpenApiFromCurl(req, res) {
  try {
    log(GET_SPEC_CREATION, `Starting OpenAPI-from-cURL Retrieval Process for record: ${req.query.jobId}`);

    const result = await apiSpecService.processOpenApiFromCurlRetrieval(req.query);
    if (!result.success) {
      res.status(500).json({ status: result.status, message: result.message });
      return;
    }

    res.status(200).json({
      status: result.status,
      data: result?.data,
      message: result.message,
    });
  } catch (error) {
    log(GET_SPEC_CREATION, `Error: ${error.message}`);
    res.status(500).json({ status: 'FAILED', message: `Error: ${error.message}` });
  }
}

async function postOpenApiFromCurl(req, res) {
  try {
    log(POST_SPEC_CREATION, `Incoming Request Body: ${JSON.stringify(req.body)}`);
    log(POST_SPEC_CREATION, 'Starting OpenAPI-from-cURL Creation Process');

    const result = await apiSpecService.processOpenApiFromCurlCreation(req.body);
    if (!result.success) {
      res.status(500).json({ message: result.message });
      return;
    }

    log(POST_SPEC_CREATION, 'Process completed successfully.');
    res.status(200).json({
      data: { jobId: result.jobId },
      message: result.message,
    });
  } catch (error) {
    log(POST_SPEC_CREATION, `Error: ${error.message}`);
    res.status(500).json({ message: 'failure' });
  }
}

exports.getOpenApiFromCurl = getOpenApiFromCurl;
exports.postOpenApiFromCurl = postOpenApiFromCurl;
