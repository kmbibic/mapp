require("collections/shim-array");
require("collections/listen/array-changes");

var BooleanExpression = require('../models/BooleanExpression');
var Simplification = require('../models/Simplification');
var StandardVariableMapper = require('../controllers/StandardVariableMapper');
var DatabaseProxy = require('../controllers/DatabaseProxy');
var SimplificationStep = require('../models/SimplificationStrategy').SimplificationStep;
var SimplificationRules = require('../models/SimplificationStrategy').SimplificationRules;

function simplifyAllRules(expression) {
    var simplifications = [];
    var currentExpression = expression;

    var simplificationStep = new SimplificationStep();
    
    for (var i in SimplificationRules) {
        simplificationStep.setStrategy(SimplificationRules[i]);
        let newExpression = simplificationStep.simplify(currentExpression);
        if (newExpression != currentExpression) {
            simplifications.push(new Simplification(newExpression, simplificationStep.strategyName()));
            currentExpression = newExpression;
        }
    }

    if (currentExpression == expression) {
        return simplifications;
    }

    return simplifications.concat(simplifyAllRules(currentExpression));
}

function evaluateSimplification(expression) {
    return simplifyAllRules(expression);
}

function simplifyBooleanExpression(expression, withSteps, callback) {
    let standardizationSchema = StandardVariableMapper.standardizeExpression(expression);
    let standardizedExpression = standardizationSchema.expression;
    let standardizationMap = standardizationSchema.map;

    if (withSteps) {
        DatabaseProxy.getSteps(standardizedExpression)
            .then((steps) => {
                var results = {};
                if (steps == null) {
                    // get steps manually
                    results = manualFind(standardizedExpression).steps;
                } else {
                    results = steps;
                }

                callback(unstandardizeSteps(results, standardizationMap));
            })
            .catch((err) => {
                console.log("Database error: " + err);
                callback(unstandardizeResult(manualFind(standardizedExpression).steps, standardizationMap));
            })
    } else {
        DatabaseProxy.getResults(standardizedExpression)
            .then((result) => {
                var results = null;
                if (result == null) {
                    // get steps manually
                    results = manualFind(standardizedExpression).result;
                } else {
                    results = result;
                }

                callback(unstandardizeResult(results, standardizationMap));
            })
            .catch((err) => {
                console.log("Database error: " + err);
                callback(unstandardizeResult(manualFind(standardizedExpression).result, standardizationMap));
            })
    }

    function manualFind(standardizedExpression) {
        let result = findBooleanSimplificationSteps(standardizedExpression);

        DatabaseProxy.writeToDatabase(standardizedExpression, result.steps, result.result)
            .then((success) => {})
            .catch((err) => {
                console.log(err);
            });

        return result; // do deep copy of object so future motifications don't affect database
    }

    function unstandardizeSteps(steps, standardizationMap) {
        for (var index in steps) {
            var currentElement = steps[index];
            steps[index].step = unstandardizeResult(currentElement.step, standardizationMap);
        }

        return steps;
    }

    function unstandardizeResult(result, standardizationMap) {
        return StandardVariableMapper.unstandardizeExpression(result, standardizationMap);
    }

    function findBooleanSimplificationSteps(standardizedExpression) {
        let parsedExpression = BooleanExpression.booleanExpressionFromString(standardizedExpression);
        var simplifications = [];
        let expandedExpression = parsedExpression.expand().toString();
        var evaluatedSimplificationSteps = evaluateSimplification(expandedExpression);
        var result = (evaluatedSimplificationSteps.length == 0) ? expandedExpression : evaluatedSimplificationSteps[evaluatedSimplificationSteps.length-1].step;

        return {
            steps: evaluatedSimplificationSteps,
            result: result
        }
    }
}

exports.getSimplifiedExpression = function(expression, callback) {
    simplifyBooleanExpression(expression, false, callback);
}

exports.getSimplificationSteps = function(expression, callback) {
    simplifyBooleanExpression(expression, true, callback);
}
