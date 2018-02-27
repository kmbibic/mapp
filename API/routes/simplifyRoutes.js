var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')
var Validator = require('../controllers/Validator');

var formatExpression = function(expression) {
    return expression.replace(/\s/g, "");
}

var validation = function(req,res, next) {
    //validate
    if (req.body == null) {
        res.status(500).json({error: "No body given"});
        return
    }

    var expression = req.body.expression;

    if (expression == "") {
        res.status(500).json({error: "No expression given"});
        return
    }

    let error = Validator.validateExpression(expression);
    console.log("Error is: " + error);
    if (error == null) {
        next();
    } else {
        res.status(500).json({error: error});
    }
};

router.use('/', validation);

// Routes 
router.post('/results', function(req, res) {
    var expression = formatExpression(req.body.expression);

    simplification.getSimplifiedExpression(expression)
        .then(function(simplifiedExpression){
            res.json({"expression": simplifiedExpression});
        })
        .catch(err => {
            console.log("error: " + err);
            res.status(500).json({error: "Simplification failed"});
        })
});

router.post('/steps', function(req, res) {
    var expression = formatExpression(req.body.expression);

    simplification.getSimplificationSteps(expression)
        .then(function(steps){
            res.json({"steps":steps});
        })
    .catch(err => {
        console.log("error: " + err);
        res.status(500).json({error: "Getting steps failed"});
    })
});

module.exports = router;