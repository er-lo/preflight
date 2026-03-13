const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const aiController = require('../controllers/ai.controller');

const jsonParser = bodyParser.json();

router.post('/', jsonParser, aiController.startAnalysis);

module.exports = router;