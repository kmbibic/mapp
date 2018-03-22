var simplificationController = require('../controllers/simplification');

exports.getSimplifiedExpression = function(expression) {
    return new Promise((resolve, reject) => {
        simplificationController.getSimplifiedExpression(expression, function(result) {
            return resolve(result);
        })
    })
}

exports.getSimplificationSteps = function(expression) {
    return new Promise((resolve, reject) => {
        simplificationController.getSimplificationSteps(expression, function(result) {
            return resolve(result);
        })
    })
}
