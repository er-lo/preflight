const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const analysisController = require('../controllers/analysis.controller');

const jsonParser = bodyParser.json();

router.get('/getAnalysis', jsonParser, analysisController.getAnalysisRecord);
router.post('/postAnalysis', jsonParser, analysisController.postAnalysisRecord);

module.exports = router;