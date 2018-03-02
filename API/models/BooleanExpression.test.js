const BooleanExpression = require("./BooleanExpression.js")
// // const sum = BooleanExpression.sum
//
// // FIXME remove this test.  Just used as a way to get started with jest testing
// test("adds 1 + 2 to equal 3", () => {
//   Expr = new BooleanExpression("A+BB", ["A", "BB"]);
//   expect(Expr.sum(1, 2)).toBe(3);
// });
//
// test("get returns the boolean expression", () => {
//   Expr = new BooleanExpression("A+BB", ["A", "BB"]);
//   expect(Expr.get()).toBe("A+BB");
// });
//
// test("set assigns the regularized boolean expression to the expression object", () => {
//   // should implicitly test the private function __regularizeValue
//   Expr = new BooleanExpression("B+AA", ["B", "AA"]);
//   expect(Expr.get()).toBe("B+AA");
//   Expr.set("A+BB");
//   expect(Expr.get()).toBe("A+BB");
// });
//
// test("isBooleanExpression returns true only for expressions with terms", () => {
//   ExprWithTerms = new BooleanExpression("A+BB", ["A", "+", "BB"]);
//   // EmptyTermsExpr = new BooleanExpression("()", [])
//   // NoTermsExpr = new BooleanExpression("()", null) // FIXME not sure whether this is [] or null, revisit this later
//   // FIXME any other cases?
//
//   expect(ExprWithTerms.isBooleanExpression().toBe(true))
//   // expect(EmptyTermsExpr.isBooleanExpression()).toBe(false);
//   // expect(NoTermsExpr.isBooleanExpression().toBe(false))
// });
//
// test("add ", () => {
//   Expr = new BooleanExpression("A+BB", ["A", "BB"]);
//   expect(Expr.get()).toBe("A+BB");
// });
//
// test("remove ", () => {
//   Expr = new BooleanExpression("A+BB", ["A", "BB"]);
//   expect(Expr.get()).toBe("A+BB");
// });
//
// test("expand ", () => {
//   // should implicitly test the private function _expandAND
//   Expr = new BooleanExpression("A+BB", ["A", "BB"])
//   expect(Expr.sum(1, 2)).toBe(false);
// });
//
// test("toString ", () => {
//   // should implicitly test the private function _expandAND
//   Expr = new BooleanExpression("A+BB", ["A", "BB"])
//   expect(Expr.sum(1, 2)).toBe(false);
// });
//
// test("booleanExpressionFromString ", () => {
//   // should implicitly test the private function _expandAND
//   Expr = new BooleanExpression("A+BB", ["A", "BB"])
//   expect(Expr.sum(1, 2)).toBe(false);
// });
