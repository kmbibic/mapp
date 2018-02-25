var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')

router.get('/results')
    .get(simplification.calculateResults)
    .post(simplification.getResults);

router.get('/steps')
    .get(simplification.calculateResults)
    .post(simplification.getSteps);

router.get('/truthTable')
    .get(simplification.calculateResults)
    .post(simplification.getTruthTable);

module.exports = router;