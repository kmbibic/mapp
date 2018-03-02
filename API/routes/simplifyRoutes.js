var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')
var Validator = require('../controllers/Validator');

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

router.get('/', function(req, res) {
    
})

// Routes 
router.post('/results', validation, function(req, res) {
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

router.post('/steps', validation, function(req, res) {
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