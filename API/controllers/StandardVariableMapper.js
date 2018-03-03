const unmappedVariableRegex = /(\+)|(\()|(\))|0|1|~/;

function expressionSchema(expression, map){
    return {
        expression: expression,
        map: map
    };
}

class CharGenerator {
    constructor(){
        this._currentChar = 65;
    }

    get currentChar() {
        return String.fromCharCode(this._currentChar);
    }

    next() {
        const lastUpperCaseCharCode = 91;
        const firstLowerCaseCharCode = 97;

        this._currentChar += 1;

        if (this._currentChar == lastUpperCaseCharCode) { //point at which it jumps from upper case to lower case
            this._currentChar = firstLowerCaseCharCode;
        }
    }
}

exports.standardizeExpression = function(expression) {
    let expressionArray = expression.split(''); // Seperate into individual terms
    var charGenerator = new CharGenerator();
    var charMap = {};
    var inverseMap = {};
    for (var index in expressionArray) {
        let element = expressionArray[index];
        if (!unmappedVariableRegex.test(element)) {
            var currentMappedChar = charMap[element];
            if (currentMappedChar == null) {
                var currentChar = charGenerator.currentChar;
                charMap[element] = currentChar;
                inverseMap[currentChar] = element;
                currentMappedChar = currentChar;
                charGenerator.next();
            }

            expressionArray[index] = currentMappedChar;
        }
    }
    return expressionSchema(expressionArray.join(''), inverseMap);
}

exports.unstandardizeExpression = function(expression, inverseMap) {
    let expressionArray = expression.split('');
    for (var index in expressionArray) {
        let element = expressionArray[index];
        if (!unmappedVariableRegex.test(element)) {
            expressionArray[index] = inverseMap[element];
        }
    }

    return expressionArray.join('');
}
