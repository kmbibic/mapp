var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')


var validation = function(req,res, next) {
    //validate
    if (req.body == null) {
        res.status(500).send({error: "No body given"});
        return
    }

    var expression = req.body.expression;

    if (expression == "") {
        res.status(500).send({error: "No expression given"});
        return
    }

    console.log("Validating");
    next();
};

router.use('/', validation);


// Routes 

router.post('/results', function(req, res) {
    var expression = req.body.expression;

    simplification.getSimplifiedExpression(expression)
        .then(function(simplifiedExpression){
            res.send(simplifiedExpression);
        })
        .catch(err => {
            console.log("error: " + err);
            res.status(500).send({error: "Simplification failed"});
        })
});

router.post('/steps', function(req, res) {
    var expression = req.body.expression;

    simplification.getSimplificationSteps(expression)
        .then(function(steps){
            res.send(steps);
        })
    .catch(err => {
        console.log("error: " + err);
        res.status(500).send({error: "Getting steps failed"});
    })
});

module.exports = router;