require("collections/shim-array");
require("collections/listen/array-changes");

var BooleanExpression = require('../models/BooleanExpression');
var Simplification = require('../models/Simplification');
var StandardVariableMapper = require('../controllers/StandardVariableMapper');

const simplificationRules = [
    {
        name: "0 AND A",
        regex: "/[^\+]*(?<!(?:\$\!))(0)(?!(?:\$\!))[^\+]*/",
        replacement: '$1'
    },{
        name: "A AND 1 (A1)",
        regex: "/([^\+]+)(?<!(?:\$\!))1(?!(?:\$\!))([^\+]*)/",
        replacement: '$1$2'
    },
    {
        name: "1 AND A (1A)",
        regex: /([^\+]*)(?<!(?:\$\!))(1)(?!(?:\$\!))([^\+]+)/,
        replacement: '$1$2'
    },
    {
        name: "A OR 1",
        regex: /(?:.*)\+(1)/,
        replacement:'$1'
    },
    {
        name: "1 OR A",
        regex: "/(1)\+(.*)/",
        replacement:'$1'
    },
    {
        name: "A OR 0",
        regex: "/(.*)\+0/",
        replacement:'$1'
    },
    {
        name: "0 OR A",
        regex: "/0\+(.*)/",
        replacement:'$1'
    },
    {
        name: "A OR A",
        regex: /((?<=\+|^)([A-Za-z0-1~]+)(?=\+)([A-Za-z0-1~\+]*)\+(\2)(?=\+|$))/,
        replacement:'$2$3'
    },
    {
        name: "A AND A",
        regex: /(?<=\+|^)([^\+]*)(?<!~)(~*[^\+])([^\+]*)((?<!~)(\2))([^\+]*)(?=\+|$)/,
        replacement:'$1$2$6' 
    }, {
        name: "NOT NOT",
        regex: /~{2}/,
        replacement:""
    }
]

function simplifyWithOneRule(expression, regex, replacement) {
    var simplifiedExpression = expression.replace(regex,replacement)
    
    if (expression == simplifiedExpression) {
        return simplifiedExpression
    }

    return simplifyWithOneRule(simplifiedExpression, regex, replacement)
}

function simplifyAllRules(expression) {
    var simplifications = [];
    var currentExpression = expression

    for (i in simplificationRules) {
        let rule = simplificationRules[i]
        let newExpression = simplifyWithOneRule(currentExpression, rule.regex, rule.replacement)

        if (newExpression != currentExpression) {
            simplifications.push(new Simplification(newExpression, rule.name))
            currentExpression = newExpression
        }
    }

    if (currentExpression == expression) {
        return simplifications
    }
    
    return simplifications.concat(simplifyAllRules(currentExpression))
}

function evaluateSimplification(expression) {
    return simplifyAllRules(expression)
}

function simplifyBooleanExpression(expression) {
    let standardizationSchema = StandardVariableMapper.standardizeExpression(expression);
    let standardizedExpression = standardizationSchema.expression;
    let standardizationMap = standardizationSchema.map;

    let parsedExpression = BooleanExpression.booleanExpressionFromString(standardizedExpression);
    var simplifications = []
    let expandedExpression = parsedExpression.expand().toString();
    let evaluatedSimplifications = evaluateSimplification(expandedExpression);

    for (var index in evaluatedSimplifications) {
        var currentElement = evaluatedSimplifications[index];
        currentElement.value = StandardVariableMapper.unstandardizeExpression(currentElement.value, standardizationMap);
    }

    return evaluatedSimplifications;
}

exports.getSimplifiedExpression = function(expression) {
    let simplifedExpression = simplifyBooleanExpression(expression);
    return simplifedExpression[simplifedExpression.length-1].value;
}

exports.getSimplificationSteps = function(expression) {
    let simplifiedExpression = simplifyBooleanExpression(expression);
    return simplifiedExpression;
}