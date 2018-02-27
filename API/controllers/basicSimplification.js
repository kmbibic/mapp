require("collections/shim-array");
require("collections/listen/array-changes");

var BooleanExpression = require('../models/BooleanExpression');
var Simplification = require('../models/Simplification');
var StandardVariableMapper = require('../controllers/StandardVariableMapper');

var standardRegexReplacement = function(expression, regex, replacement) {
    return expression.replace(regex,replacement);
}

const simplificationRules = [
    {
        name: "0 AND A",
        method: function(expression) {
            let regex = /[^\+]*(?<!(?:\$\!))(0)(?!(?:\$\!))[^\+]*/;
            let replacement = '$1';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },{
        name: "A AND 1 (A1)",
        method: function(expression) {
            let regex = /([^\+]+)(?<!(?:\$\!))1(?!(?:\$\!))([^\+]*)/;
            let replacement = '$1$2';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "1 AND A (1A)",
        method: function(expression) {
            let regex = /([^\+]*)(?<!(?:\$\!))(1)(?!(?:\$\!))([^\+]+)/;
            let replacement = '$1$2';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "A OR 1",
        method: function(expression) {
            let regex = /(?:.*)\+(1)/;
            let replacement = '$1';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "1 OR A",
        method: function(expression) {
            let regex = /(1)\+(.*)/;
            let replacement = '$1';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "A OR 0",
        method: function(expression) {
            let regex = /(.+)\+(0)/;
            let replacement = '$1';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "0 OR A",
        method: function(expression) {
            let regex = /(0)\+(.+)/;
            let replacement = '$2';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "A OR A",
        method: function(expression) {
            let regex = /((?<=\+|^)([A-Za-z0-1~]+)(?=\+)([A-Za-z0-1~\+]*)\+(\2)(?=\+|$))/;
            let replacement = '$2$3';
            return standardRegexReplacement(expression, regex, replacement);
        }
    },
    {
        name: "A AND A",
        method: function(expression) {
            let regex = /(?<=\+|^)([^\+]*)(?<!~)(~?[^\+~])([^\+]*)((?<!~)(\2))([^\+]*)(?=\+|$)/;
            let replacement = '$1$2$6';
            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "NOT NOT",
        method: function(expression) {
            let regex = /~{2}/;
            let replacement = '';
            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "A NOT A",
        method: function(expression) {
            let regex = /((?<!~)([^\+~]))([^\+]*)(~\2)([^\+]*)/;
            let replacement = '0';
            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "NOT A A",
        method: function(expression) {
            let regex = /((?:~)([^\+~]))([^\+]*)(?<!~)(\2)([^\+]*)/;
            let replacement = '0';
            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "AB + ~AB",
        method: function(expression) {
            let regex = /((?<=\+|^)(([^\+]*)(?<!~)([^\+~])([^\+]*))(?=\+)([A-Za-z0-1~\+]*)\+(\3)(~\4)(\5)(?=\+|$))/;
            let replacement = '$3$5$6';

            let regexResult = regex.exec(expression);

            if (regexResult == null) {
                return expression;
            }

            if (regexResult[5] == "") {
                replacement = '0$3$6'
            }

            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "~AB + AB",
        method: function(expression) {
            let regex = /((?<=\+|^)(([^\+]*)(?:~)([^\+~])([^\+]*))(?=\+)([A-Za-z0-1~\+]*)\+(\3)(\4)(\5)(?=\+|$))/;
            let replacement = '$3$5$6';

            let regexResult = regex.exec(expression);

            if (regexResult == null) {
                return expression;
            }

            if (regexResult[5] == "") {
                replacement = '0$3$6'
            }

            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "A + AB",
        method: function(expression) {
            let terms = expression.match(/([A-Za-z01\~]+)/g)

            for (var i in terms) {
                let term = terms[i];

                let baseElementTerms = term.match(/~*[A-Za-z01]/g);
                
                for (var j in terms) {
                    if (i == j) {
                        continue;
                    }

                    let compareTerm = terms[j]
                    var foundMatch = true; 
                    for (var k = 0; k < baseElementTerms.length; k++) {
                        let regex = new RegExp("(?<!~)"+ baseElementTerms[k]+"");
                        if (!regex.test(compareTerm)) {
                            foundMatch = false;
                            break;
                        }
                    }

                    if (foundMatch) {
                        let newTerms = terms;
                        newTerms.splice(j,1);
                        return newTerms.join('+');
                    }
                }
            }
            return terms.join('+');
        }
    }
]

function simplifyWithOneRule(expression, method) {
    var simplifiedExpression = method(expression)
    
    if (expression == simplifiedExpression) {
        return simplifiedExpression
    }

    return simplifyWithOneRule(simplifiedExpression, method)
}

function simplifyAllRules(expression) {
    var simplifications = [];
    var currentExpression = expression

    for (i in simplificationRules) {
        let rule = simplificationRules[i]
        let newExpression = simplifyWithOneRule(currentExpression, rule.method)
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

function simplifyBooleanExpression(expression, withSteps) {
    let standardizationSchema = StandardVariableMapper.standardizeExpression(expression);
    let standardizedExpression = standardizationSchema.expression;
    let standardizationMap = standardizationSchema.map;

    let parsedExpression = BooleanExpression.booleanExpressionFromString(standardizedExpression);
    var simplifications = []
    let expandedExpression = parsedExpression.expand().toString();
    let evaluatedSimplifications = evaluateSimplification(expandedExpression);
    
    if (evaluatedSimplifications.length == 0 && withSteps == false) {
        // no simplification necessary & just want result 
        return StandardVariableMapper.unstandardizeExpression(expandedExpression, standardizationMap);
    }

    for (var index in evaluatedSimplifications) {
        var currentElement = evaluatedSimplifications[index];
        currentElement.value = StandardVariableMapper.unstandardizeExpression(currentElement.value, standardizationMap);
    }

    if (withSteps) {
        return evaluatedSimplifications;
    } else {
        return evaluatedSimplifications[evaluatedSimplifications.length-1].value;
    }

}

exports.getSimplifiedExpression = function(expression) {
    let simplifedExpression = simplifyBooleanExpression(expression, false);
    return simplifedExpression;
}

exports.getSimplificationSteps = function(expression) {
    let simplifiedExpression = simplifyBooleanExpression(expression, true);
    return simplifiedExpression;
}