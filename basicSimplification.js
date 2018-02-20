require("collections/shim-array");
require("collections/listen/array-changes");

const booleanOperations = {
    AND: 0,
    OR: 1
}

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
        regex: /((?<=\+|^)([A-Za-z0-1~]+)\+(\2)(?=\+|$))/,
        replacement:'$2'
    },
    {
        name: "A AND A",
        regex: /(?<=\+|^)(?<!~)(~*.)([^\+]*)((?<!~)(\1))(?=\+|$)/,
        replacement:'$1$2' 
    }, {
        name: "NOT NOT",
        regex: /~{2}/,
        replacement:""
    }
]

class BooleanExpression {
    constructor(value, terms) {
        this.value = value;
        this.terms = terms;
    }

    get value(){
        return this._value;
    }

    set value(value) {
        this._value = this._regularizeValue(value);
    }

    _regularizeValue(value) {
        return String(value).match(/~*[A-Za-z01]/g).sort().join('')
    }

    isBooleanExpression() {
        if (this.terms.length <= 0) {
            return false;
        } else {
            return true;
        }
    }

    remove(removeTerm) {
        var length = this.terms.length;
        for (var i = 0; i < length; i++) {
            if (removeTerm === this.terms[i]) {
                this.terms.splice(i,1);
                return;
            }
        }
    }

    add(term) {
        this.terms.push(term);
    }

    _expandAND(expression1, expression2) {
        var isBooleanE1 = expression1.isBooleanExpression()
        var isBooleanE2 = expression2.isBooleanExpression()

        function multiplyTerm(term, sequence) {
            var newTerm = new BooleanExpression(booleanOperations.OR,[]);

            for (var index in sequence.terms) {
                let sequenceTerm = sequence.terms[index];
                let newValue = sequenceTerm.value + term.value;
                newTerm.add(new BooleanExpression(newValue,[]))
            }

            return newTerm;
        }

        if (!isBooleanE1 && !isBooleanE2) {
            expression1.value += expression2.value;
            return expression1;
        } else if (!isBooleanE1) {
            return multiplyTerm(expression1, expression2);
        } else if (!isBooleanE2) {
            return multiplyTerm(expression2, expression1);;
        } else {
            var newTerm = new BooleanExpression(booleanOperations.OR,[]);
            for (var innerIndex in expression1.terms) {
                let currentTerm = expression1.terms[innerIndex];
                newTerm.add(multiplyTerm(currentTerm, expression2));
            }
            return newTerm;
        }
    }

    expand() {
        if (!this.isBooleanExpression()) {
            return this;
        } else {
            var i = 0;
            while (i < this.terms.length && this.terms.length > 1) {
                let currentTerm = this.terms[i].expand();

                if (currentTerm.isBooleanExpression() && currentTerm.value == this.value) {
                    // If operation is same as parent, combine 
                    this.terms = this.terms.concat(currentTerm.terms);
                    this.remove(this.terms[i]);
                    continue;
                } else if (this.value == booleanOperations.AND) {
                    if (i == 0) {
                        this.terms[i] = currentTerm;
                        i++;
                        continue;
                    }

                    let newTerm = this._expandAND(currentTerm, this.terms[i-1]);
                    this.terms = this.terms.concat(newTerm);
                    this.remove(this.terms[i]);
                    this.remove(this.terms[i-1]);
                    i--;
                    continue;
                }

                this.terms[i] = currentTerm;
                i++;
            }

            if (this.terms.length == 1) {
                return this.terms[0];
            }

            return this;
        }
    }

    toString() {
        var finalString = "";
        if (this.isBooleanExpression()) {
            let prefix = this.value == booleanOperations.AND ? "" : "+";

            this.terms.forEach(element => {
                if (finalString != "") {
                    finalString += prefix
                }
                finalString += element.toString() 
            });
        } else {
            finalString += this.value
        }

        return finalString
    }
}

function parseBooleanExpression(stringExpression) { 
    let expressionArray = stringExpression.match(/([A-Za-z01\~]+)|(\+)|(\()|(\))/g); // AB+C [AB,+,C]
    var values = [];
    var operations = []

    var precedingValue = false;

    function applyOpps() {
        let operation = operations.pop();
        let val1 = values.pop();
        let val2 = values.pop();
        let booleanExpression = new BooleanExpression(operation,[val1,val2]);
        values.push(booleanExpression);
    }

    for (index in expressionArray) {
        let element = expressionArray[index];
        if (!(/(\+)|(\()|(\))/).test(element)) {
            let booleanExpression = new BooleanExpression(element,[]);
            values.push(booleanExpression);
            precedingValue = true;
        } else if(element == "+") {
            operations.push(booleanOperations.OR);
            precedingValue = false;
        } else if(element == "(") {
            if (precedingValue == true) {
                operations.push(booleanOperations.AND);
            }
            operations.push("(");
            precedingValue == false;
        } else if(element == ")") {
            while(!(operations.peekBack() == "(")) {
                applyOpps();
            }
            operations.pop();
            precedingValue == true;
        }
    }

    while (operations.length > 0) {
        applyOpps()
    }

    return values[0];
}

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
        // console.log(currentExpression + " using " + rule.name)
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
    console.log(evaluatedSimplifications);
}

let parsedExpression = parseBooleanExpression("B~~a+~~~~AB+(B+C)");
simplifyBooleanExpression(parsedExpression);