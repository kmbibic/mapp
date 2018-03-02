var simplificationController = require('../controllers/simplification');

function getSimplifiedExpression(expression, callback) {
    simplificationController.getSimplifiedExpression(expression, callback);
}

function getSimplificationSteps(expression, callback) {
    simplificationController.getSimplificationSteps(expression, callback);
}

exports.getSimplifiedExpression = function(expression) {
    return new Promise((resolve, reject) => {
        getSimplifiedExpression(expression, function(result) {
            return resolve(result);
        })
    })
}

exports.getSimplificationSteps = function(expression) {
    return new Promise((resolve, reject) => {
        getSimplificationSteps(expression, function(result) {
            return resolve(result);
        })
    })
}
