require("collections/shim-array");
require("collections/listen/array-changes");

var BooleanExpression = require('../models/BooleanExpression');
var Simplification = require('../models/Simplification');
var StandardVariableMapper = require('../controllers/StandardVariableMapper');
var DatabaseProxy = require('../controllers/DatabaseProxy')

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
                callback(unstandardizeResult(manualFind(standardizedExpression).steps, standardizationMap))
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
                callback(unstandardizeResult(manualFind(standardizedExpression).result, standardizationMap))
            })
    }
    
    function manualFind(standardizedExpression) {
        // console.log("Doing manual find");
        let result = findBooleanSimplificationSteps(standardizedExpression);

        DatabaseProxy.writeToDatabase(standardizedExpression, result.steps, result.result)
            .then((success) => {})
            .catch((err) => {
                console.log(err);
            })
        
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
        var simplifications = []
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