// // FIXME REMOVE THIS START
// function sum(a, b) {
//   return a + b;
// }
// module.exports = sum;
// // FIXME REMOVE THIS END

const booleanOperations = {
    AND: 0,
    OR: 1
}

module.exports = class BooleanExpression {
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
        let sortedArray = String(value).match(/~*[A-Za-z01]/g).sort(function(a,b){
            let aWithoutNots = (a.match(/[^~]/)[0]).charCodeAt(0);
            let bWithoutNots = (b.match(/[^~]/)[0]).charCodeAt(0);

            if (aWithoutNots == bWithoutNots) {
                return a.charCodeAt(0)-b.charCodeAt(0);
            }

            return aWithoutNots-bWithoutNots;
        });
        return sortedArray.join('')
    }

    isBooleanExpression() {
        if (this.terms.length <= 0) {
            return false;
        } else {
            return true;
        }
    }

    // FIXME REMOVE THIS START
    sum(a, b) {
      return a + b;
    }
    // FIXME REMOVE THIS END

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
            var arr = [];

            for (var innerIndex in expression1.terms) {
                let currentTerm = expression1.terms[innerIndex];
                var newTerms = multiplyTerm(currentTerm, expression2);
                arr = arr.concat(newTerms.terms);
            }

            var newTerm = new BooleanExpression(booleanOperations.OR,arr);
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

    static booleanExpressionFromString(stringExpression) {
        let expressionArray = stringExpression.match(/([A-Za-z01\~]+)|(\+)|(\()|(\))/g);
        var values = [];
        var operations = []

        var precedingValue = false;

        function applyOps() {
            let operation = operations.pop();
            let val1 = values.pop();
            let val2 = values.pop();
            let booleanExpression = new BooleanExpression(operation,[val1,val2]);
            values.push(booleanExpression);
        }

        for (var index in expressionArray) {
            let element = expressionArray[index];
            if (!(/(\+)|(\()|(\))/).test(element)) {
                let booleanExpression = new BooleanExpression(element,[]);

                if (precedingValue == true) {
                    operations.push(booleanOperations.AND);
                }

                values.push(booleanExpression);
                precedingValue = true;
            } else if(element == "+") {
                while(operations.length > 0 && operations.peekBack() == booleanOperations.AND){
                    applyOps();
                }
                operations.push(booleanOperations.OR);
                precedingValue = false;
            } else if(element == "(") {
                if (precedingValue == true) {
                    operations.push(booleanOperations.AND);
                }
                operations.push("(");
                precedingValue = false;
            } else if(element == ")") {
                while(!(operations.peekBack() == "(")) {
                    applyOps();
                }
                operations.pop();
                precedingValue = true;
            }
        }

        while (operations.length > 0) {
            applyOps()
        }

        return values[0];
    }
}
