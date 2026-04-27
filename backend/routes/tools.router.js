const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const analysisController = require('../controllers/analysis.controller');
const apiSpecController = require('../controllers/api-spec.controller');
const endpointGuideController = require('../controllers/endpoint-guide.controller');

const jsonParser = bodyParser.json();

router.get('/api-analysis', analysisController.getAnalysis);
router.post('/api-analysis', jsonParser, analysisController.createAnalysis);
router.get('/openapi-from-curl', apiSpecController.getOpenApiFromCurl);
router.post('/openapi-from-curl', jsonParser, apiSpecController.postOpenApiFromCurl);
router.get('/openapi-endpoint-guide', endpointGuideController.getEndpointDataGuide);
router.post('/openapi-endpoint-guide', jsonParser, endpointGuideController.postEndpointDataGuide);

module.exports = router;
