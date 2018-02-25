var express = require('express');
var router = express.Router();

var simplification = require('../controllers/simplificationController')

function resultSchema() {
    return {
        "result":""
    }
}

var validation = function(req,res, next) {
    //validate
    console.log("Validating");
    next();
};

router.use('/:expression', validation);


// Routes 

router.get('/:expression/results', function(req, res) {
    console.log("results");
    simplification.getSimplifiedExpression(req.params.expression)
        .then(function(simplifiedExpression){
            var response = resultSchema()
            response.result = simplifiedExpression;

            res.send(response);
        })
        .catch(err => {
            console.log("error: " + err);
        })
});

router.get('/:expression/steps', function(req, res) {
    console.log("steps");
    res.end()
});

router.get('/:expression/truthTable', function(req, res) {
    console.log("truthTable");
    res.end()
});

module.exports = router;