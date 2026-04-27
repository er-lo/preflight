const endpointGuideService = require('../service/endpoint-guide.service');
const { log } = require('../utils/log');
const { LOG_PREFIXES } = require('../constants/constants');

const { GET_ENDPOINT_GUIDE, POST_ENDPOINT_GUIDE } = LOG_PREFIXES;

async function getEndpointDataGuide(req, res) {
  try {
    log(GET_ENDPOINT_GUIDE, `Starting Endpoint Guide Retrieval Process for record: ${req.query.jobId}`);

    const result = await endpointGuideService.processEndpointGuideRetrieval(req.query);
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
    log(GET_ENDPOINT_GUIDE, `Error: ${error.message}`);
    res.status(500).json({ status: 'FAILED', message: `Error: ${error.message}` });
  }
}

async function postEndpointDataGuide(req, res) {
  try {
    log(POST_ENDPOINT_GUIDE, `Incoming Request Body: ${JSON.stringify(req.body)}`);
    log(POST_ENDPOINT_GUIDE, 'Starting Endpoint Guide Creation Process');

    const result = await endpointGuideService.processEndpointGuideCreation(req.body);
    if (!result.success) {
      res.status(500).json({ message: result.message });
      return;
    }

    log(POST_ENDPOINT_GUIDE, 'Process completed successfully.');
    res.status(200).json({
      data: { jobId: result.jobId },
      message: result.message,
    });
  } catch (error) {
    log(POST_ENDPOINT_GUIDE, `Error: ${error.message}`);
    res.status(500).json({ message: 'failure' });
  }
}

exports.getEndpointDataGuide = getEndpointDataGuide;
exports.postEndpointDataGuide = postEndpointDataGuide;
