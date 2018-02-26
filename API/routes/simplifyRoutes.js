var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')


var validation = function(req,res, next) {
    //validate
    console.log("Validating");
    next();
};

router.use('/:expression', validation);


// Routes 

router.get('/:expression/results', function(req, res) {
    simplification.getSimplifiedExpression(req.params.expression)
        .then(function(simplifiedExpression){
            res.send(simplifiedExpression);
        })
        .catch(err => {
            console.log("error: " + err);
            res.status(500).send({error: "Simplification failed"});
        })
});

router.get('/:expression/steps', function(req, res) {
    simplification.getSimplificationSteps(req.params.expression)
        .then(function(steps){
            res.send(steps);
        })
    .catch(err => {
        console.log("error: " + err);
        res.status(500).send({error: "Getting steps failed"});
    })
});

router.get('/:expression/truthTable', function(req, res) {
    console.log("truthTable");
    res.end()
});

module.exports = router;