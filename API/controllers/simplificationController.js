var basicSimplificationController = require('../controllers/basicSimplification');

function getSimplifiedExpression(expression) {
    let newExpression = basicSimplificationController.getSimplifiedExpression(expression);
    return newExpression;
}

function getSimplificationSteps(expression) {
    let steps = basicSimplificationController.getSimplificationSteps(expression);
    return steps;
}

exports.getSimplifiedExpression = function(expression) {
    return new Promise((resolve, reject) => {
        return resolve(getSimplifiedExpression(expression));
    })
}

exports.getSimplificationSteps = function(expression) {
    return new Promise((resolve, reject) => {
        let steps = getSimplificationSteps(expression);
        return resolve(steps);
    })
}

