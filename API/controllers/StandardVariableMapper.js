function expressionSchema(expression, map){
    return {
        expression: expression,
        map: map
    }
}

class CharGenerator {
    constructor(){
        this._currentChar = 65;
    }

    get currentChar() {
        return String.fromCharCode(this._currentChar);
    }

    next() {
        this._currentChar += 1;
        
        if (this._currentChar == 91) { //point at which it jumps from upper case to lower case
            this._currentChar = 97; 
        }
    }
}

exports.standardizeExpression = function(expression) {
    let expressionArray = expression.match(/([A-Za-z01\~])|(\+)|(\()|(\))/g)
    var charGenerator = new CharGenerator();
    var charMap = {};
    var inverseMap = {}
    for (var index in expressionArray) {
        let element = expressionArray[index];
        if (!(/(\+)|(\()|(\))|0|1/).test(element)) {
            var currentMappedChar = charMap[element];
            if (currentMappedChar == null) {
                var currentChar = charGenerator.currentChar
                charMap[element] = currentChar;
                inverseMap[currentChar] = element; 
                currentMappedChar = currentChar;
                charGenerator.next()
            }

            expressionArray[index] = currentMappedChar;
        }
    }

    return expressionSchema(expressionArray.join(''), inverseMap);
}

exports.unstandardizeExpression = function(expression, inverseMap) {
    let expressionArray = expression.match(/([A-Za-z01\~])|(\+)|(\()|(\))/g)
    for (var index in expressionArray) {
        let element = expressionArray[index];
        if (!(/(\+)|(\()|(\))|0|1/).test(element)) {
            expressionArray[index] = inverseMap[element];
        }
    }

    return expressionArray.join('');
}