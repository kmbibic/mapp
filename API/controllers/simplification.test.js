const simplification = require("./simplification.js")

const INVALID_EXPR_ERROR_MESSAGE = "Unable to compute this expression. Ensure" +
  " the expression has valid operations.";
const BRACKET_ERROR_MESSAGE = "Please ensure valid allignment of brackets.";
const EMPTY_EXPR_ERROR_MESSAGE = "Please enter an expression with at least 1" +
  " character";
const INVALID_CHAR_IN_EXPR_ERROR_MESSAGE = "Please enter an expression with" +
  " valid characters. Only 0,1, letters, ~, +, ( and ) are allowed.";

function testSimplifyResults(testExpression, expectedResult) {
    function callback(response) {
      expect(response).toBe(expectedResult);
      // done();
    }

    simplification.getSimplifiedExpression(testExpression, callback);
}

test("getSimplifiedExpression properly simplifies basic expressions", () => {
  expect.assertions(7);

  testSimplifyResults("A+A", "A"); // don't think this tests asynchronously
  testSimplifyResults("A+0", "A");
  testSimplifyResults("0+A", "A");
  testSimplifyResults("A+1", "1");
  testSimplifyResults("1+A", "1");
  testSimplifyResults("A0", "0");
  testSimplifyResults("A1", "A");
});

test("getSimplifiedExpression properly simplifies compound expressions", done => {
  function callback(response, expected) {
    expect(response).toBe(expected);
    done();
  }

  simplification.getSimplifiedExpression("(A+B)C", callback("(A+B)C"));
  simplification.getSimplifiedExpression("(A+A)+B", callback("A+B"));
});

test("getSimplifiedExpression returns expected error messages for invalid inputs", done => {
  function callback(response, expected) {
    expect(response).toBe(expected);
    done();
  }

  simplification.getSimplifiedExpression("~A~", callback(INVALID_EXPR_ERROR_MESSAGE));
  simplification.getSimplifiedExpression("A++A", callback(INVALID_EXPR_ERROR_MESSAGE));
  simplification.getSimplifiedExpression("A+", callback(INVALID_EXPR_ERROR_MESSAGE));
  simplification.getSimplifiedExpression(")A+A(", callback(BRACKET_ERROR_MESSAGE));
  simplification.getSimplifiedExpression("(A+A))", callback(BRACKET_ERROR_MESSAGE));
  simplification.getSimplifiedExpression("", callback(EMPTY_EXPR_ERROR_MESSAGE));
  simplification.getSimplifiedExpression("$->$", callback(INVALID_CHAR_IN_EXPR_ERROR_MESSAGE));
});

test("getSimplificationSteps includes correct steps in response", done => {
  function callback(response, expected_expr, expectedSteps) {
    expect(response).toBe(expected);
    done();
  }

  simplification.getSimplificationSteps("(AB+A)AA+AB+BA", callback("AB", []));
  simplification.getSimplificationSteps("A", callback("A", []));
  simplification.getSimplificationSteps("(A1+0)A+AB", callback("AB", []));
});
