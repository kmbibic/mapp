const Validator = require("./Validator.js")

const INVALID_EXPR_ERROR_MESSAGE = "Unable to compute this expression. Ensure" +
  " the expression has valid operations.";
const BRACKET_ERROR_MESSAGE = "Please ensure valid allignment of brackets.";
const EMPTY_EXPR_ERROR_MESSAGE = "Please enter an expression with at least 1" +
  " character";
const INVALID_CHAR_IN_EXPR_ERROR_MESSAGE = "Please enter an expression with" +
  " valid characters. Only 0,1, letters, ~, +, ( and ) are allowed.";

test("getSimplifiedExpression returns expected error message for ~A~", () => {
  expect(Validator.validateExpression("~A~")).toBe(INVALID_EXPR_ERROR_MESSAGE);
});

test("getSimplifiedExpression returns expected error message for A++A", () => {
  expect(Validator.validateExpression("A++A")).toBe(INVALID_EXPR_ERROR_MESSAGE);
});

test("getSimplifiedExpression returns expected error message for A+", () => {
  expect(Validator.validateExpression("A+")).toBe(INVALID_EXPR_ERROR_MESSAGE);
});

test("getSimplifiedExpression returns expected error message for )A+A(", () => {
  expect(Validator.validateExpression(")A+A(")).toBe(BRACKET_ERROR_MESSAGE);
});

test("getSimplifiedExpression returns expected error message for (A+A))", () => {
  expect(Validator.validateExpression("(A+A))")).toBe(BRACKET_ERROR_MESSAGE);
});

test("getSimplifiedExpression returns expected error message for empty expression", () => {
  expect(Validator.validateExpression("")).toBe(EMPTY_EXPR_ERROR_MESSAGE);
});

test("getSimplifiedExpression returns expected error message for $->$", () => {
  expect(Validator.validateExpression("$->$")).toBe(INVALID_CHAR_IN_EXPR_ERROR_MESSAGE);
});
