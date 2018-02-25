require("collections/shim-array");
require("collections/listen/array-changes");

var BooleanExpression = require('../models/BooleanExpression');

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
    var currentExpression = expression

    for (i in simplificationRules) {
        let rule = simplificationRules[i]
        currentExpression = simplifyWithOneRule(currentExpression, rule.regex, rule.replacement)
        console.log(currentExpression + " using " + rule.name)
    }

    if (currentExpression == expression) {
        return currentExpression
    }
    
    return simplifyAllRules(currentExpression)
}

function evaluateSimplification(expression) {
    return simplifyAllRules(expression)
}

function simplifyBooleanExpression(parsedExpression) {
    var simplifications = []
    
    let expandedExpression = parsedExpression.expand().toString();
    console.log(expandedExpression);
    let evaluatedSimplifications = evaluateSimplification(expandedExpression);
    return evaluatedSimplifications;
}

exports.getSimplifiedExpression = function(expression) {
    console.log(expression);
    let parsedExpression = BooleanExpression.booleanExpressionFromString(expression);
    return simplifyBooleanExpression(parsedExpression);
}