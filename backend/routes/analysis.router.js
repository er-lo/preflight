const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const analysisController = require('../controllers/analysis.controller');

const jsonParser = bodyParser.json();

router.get('/', analysisController.getAnalysis);
router.post('/', jsonParser, analysisController.createAnalysis);

module.exports = router;