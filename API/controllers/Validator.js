var checkValidCharacters = function(expression) {
  return !(/[^a-zA-z0-1\+\~\(\)]/.test(expression))
}
  
var checkValidLength = function(expression) {
  return expression.length != 0
}
  
var checkHangingOperator = function(expression) {
  return !(/((\+){2,}|(^(\+))|((\+|~)$))/.test(expression));
}
  
var checkForValidOperation = function(expression) {
  return !(/(~\()|(\~\+)|(\(\+)|(\+\))|(\(\))/.test(expression));
}
  
var checkBrackets = function(expression) {
  var currentlyOpenBrackets = 0

  for (var character = 0; character < expression.length; character++) {
    if (expression.charAt(character) == '(') {
      currentlyOpenBrackets++;
    } else if(expression.charAt(character) == ')') {
      currentlyOpenBrackets--;
    }

    if (currentlyOpenBrackets < 0){
      return false;
    }
  }

  if (currentlyOpenBrackets == 0) {
    return true;
  }

  return false;
}
  
exports.validateExpression = function(expression) {
  let parsedExpression = expression.replace(/\s/g, "")

  if (!checkValidLength(parsedExpression)) {
    return "Please enter an expression with at least 1 character"
  }

  if (!checkValidCharacters(parsedExpression)) {
    return "Please enter an expression with valid characters. Only 0,1, letters, ~, +, ( and ) are allowed."
  }

  if (!checkBrackets(parsedExpression)) {
    return "Please ensure valid allignment of brackets."
  }

  if (!checkHangingOperator(parsedExpression)) {
    return "Unable to compute this expression. Ensure the expression has valid operations."
  }

  return null
}
  