var basicSimplificationController = require('../controllers/basicSimplification');

function getSimplifiedExpression(expression, callback) {
    basicSimplificationController.getSimplifiedExpression(expression, callback);
}

function getSimplificationSteps(expression, callback) {
    basicSimplificationController.getSimplificationSteps(expression, callback);
}

exports.getSimplifiedExpression = function(expression) {
    return new Promise((resolve, reject) => {
        getSimplifiedExpression(expression, function(result){
            return resolve(result)
        })
    })
}

exports.getSimplificationSteps = function(expression) {
    return new Promise((resolve, reject) => {
        getSimplificationSteps(expression, (result) => {
            return resolve(result)
        })
    })
}

