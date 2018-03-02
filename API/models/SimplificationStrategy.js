var standardRegexReplacement = function(expression, regex, replacement) {
    return expression.replace(regex,replacement);
}

var SimplificationStep = function() {
    this.strategy = "";
}

SimplificationStep.prototype = {
    setStrategy: function(strategy) {
        this.strategy = strategy;
    },

    simplify: function(expression) {
        var currentExpression = expression;
        var simplifiedExpression = this.strategy.method(expression);

        while (currentExpression != simplifiedExpression) {
            currentExpression = simplifiedExpression;
            simplifiedExpression = this.strategy.method(currentExpression);
        }
    
        return simplifiedExpression;
    }, 

    strategyName: function() {
        return this.strategy.name;
    }
}

const SimplificationRules = [
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
                replacement = '0$3$6';
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
                replacement = '0$3$6';
            }

            return standardRegexReplacement(expression, regex, replacement);
        }
    }, {
        name: "A + AB",
        method: function(expression) {
            let terms = expression.match(/([A-Za-z01\~]+)/g);

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

exports.SimplificationRules = SimplificationRules;
exports.SimplificationStep = SimplificationStep;