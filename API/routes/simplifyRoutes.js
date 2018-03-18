var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')
var Validator = require('../controllers/Validator');

var Visitor = require('../authentication/Visitor')
var Nodes = require('../authentication/LockedDataNode')
var LockedStepsNode = Nodes.LockedStepsNode
var LockedSimplifyNode = Nodes.LockedSimplifyNode

var formatExpression = function(expression) {
    return expression.replace(/\s/g, "");
}

var validation = function(req,res, next) {
    if (req.body == null) {
        res.status(400).json({error: "No body given"});
        return
    }

    var expression = formatExpression(req.body.expression);

    if (expression == "") {
        res.status(400).json({error: "No expression given"});
        return
    }

    let error = Validator.validateExpression(expression);

    if (error == null) {
        next();
    } else {
        res.status(400).json({error: error});
    }
};

var stepsValidation = function(req, res, next) {
    let node = LockedStepsNode(res, next);
    let visitor = new Visitor();
    let userCredentials = req.user;

    node.accept(visitor, userCredentials);
}

var simplifyValidation = function(req, res, next) {
    let node = LockedSimplifyNode(res, next);
    let visitor = Visitor();
    let userCredentials = req.user;

    node.accept(visitor, userCredentials);
}

router.get('/', function(req, res) {
    res.json({
        "description":"simplify links",
        "links": [
            {
                rel: "self",
                href: "http://localhost:3000/simplify"
            },{
                rel: "results",
                href: "http://localhost:3000/simplify/results"
            },{
                rel: "steps",
                href: "http://localhost:3000/simplify/steps"
            },
        ]
    })
})

// Routes 
router.post('/results', simplifyValidation, validation, function(req, res) {
    var expression = formatExpression(req.body.expression);

    simplification.getSimplifiedExpression(expression)
        .then(function(simplifiedExpression){
            res.json({"expression": simplifiedExpression});
        })
        .catch(err => {
            console.log("error: " + err);
            res.status(500).json({error: "Server error: Simplification failed"});
        })
});

router.post('/steps', stepsValidation, validation, function(req, res) {
    var expression = formatExpression(req.body.expression);

    simplification.getSimplificationSteps(expression)
        .then(function(steps){
            res.json({"steps":steps});
        })
    .catch(err => {
        console.log("error: " + err);
        res.status(500).json({error: "Server error: Getting steps failed."});
    })
});

module.exports = router;