const BooleanExpression = require("./simplification.js")

var test_cases = [
    {
        input:"A+A",
        expectedOutput:"A",
    },{
        input:"A+0",
        expectedOutput:"A",
    },{
        input:"0+A",
        expectedOutput:"A",
    },{
        input:"A+1",
        expectedOutput:"1",
    },{
        input:"1+A",
        expectedOutput:"1",
    },{
        input:"A0",
        expectedOutput:"0",
    },{
        input:"A1",
        expectedOutput:"A",
    },{
        input:"(A+B)C",
        expectedOutput:"(A+B)C",
    },{
        input:"(A+A)+B",
        expectedOutput:"A+B",
    },{
        input:"~A~",
        expectedOutput:"Unable to compute this expression. Ensure the expression has valid operations.",
    },{
        input:"A++",
        expectedOutput:"Unable to compute this expression. Ensure the expression has valid operations.",
    },{
        input:"A+",
        expectedOutput:"Unable to compute this expression. Ensure the expression has valid operations.",
    },{
        input:")A+A(",
        expectedOutput:"Please ensure valid allignment of brackets.",
    },{
        input:"",
        expectedOutput:"Please enter an expression with at least 1 character",
    },{
        input:"$->$",
        expectedOutput:"Please enter an expression with valid characters. Only 0,1, letters, ~, +, ( and ) are allowed.",
    }
]

test("getSimplifiedExpression", () => {
  Expr = new BooleanExpression("A+BB", ["A", "BB"]);
  var test = function() {
      for (var i = 0; i < tests.length; i++) {
          let currentTest = tests[i]
          console.log(currentTest)
          let output = MAPPServer.simplifyExpression(currentTest.input)

          expect(output.error != null && currentTest.expectedOutput == output.error || (output.expression == currentTest.expectedOutput))
      }
  expect(Expr.sum(1, 2)).toBe(3);
});

test("getSimplificationSteps", () => {

});
