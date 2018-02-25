var basicSimplificationController = require('../controllers/basicSimplification');

exports.getSimplifiedExpression = function(expression) {
    console.log("Get results");

    return new Promise((resolve, reject) => {
        let newExpression = basicSimplificationController.getSimplifiedExpression(expression);
        console.log(newExpression);
        return resolve(newExpression);
    })
}

exports.getSteps = function(req, res) {
    console.log("Get steps");
}

exports.getTruthTable = function(req, res) {
    console.log("Get truth table");
}

