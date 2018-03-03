const simplification = require("./simplification.js")
const Simplification = require("../models/Simplification.js")

test("getSimplifiedExpression properly simplifies A+A", done => {
  function callback(response) {
    expect(response).toBe("A");
    done();
  }

  simplification.getSimplifiedExpression("A+A", callback);
});

test("getSimplifiedExpression properly simplifies A+0", done => {
  function callback(response) {
    expect(response).toBe("A");
    done();
  }

  simplification.getSimplifiedExpression("A+0", callback);
});


test("getSimplifiedExpression properly simplifies 0+A", done => {
  function callback(response) {
    expect(response).toBe("A");
    done();
  }

  simplification.getSimplifiedExpression("0+A", callback);
});

test("getSimplifiedExpression properly simplifies A+1", done => {
  function callback(response) {
    expect(response).toBe("1");
    done();
  }

  simplification.getSimplifiedExpression("A+1", callback);
});

test("getSimplifiedExpression properly simplifies 1+A", done => {
  function callback(response) {
    expect(response).toBe("1");
    done();
  }

  simplification.getSimplifiedExpression("1+A", callback);
});

test("getSimplifiedExpression properly simplifies A0", done => {
  function callback(response) {
    expect(response).toBe("0");
    done();
  }

  simplification.getSimplifiedExpression("A0", callback);
});

test("getSimplifiedExpression properly simplifies A1", done => {
  function callback(response) {
    expect(response).toBe("A");
    done();
  }

  simplification.getSimplifiedExpression("A1", callback);
});

test("getSimplifiedExpression properly simplifies (A+B)C", done => {
  function callback(response) {
    expect(response).toBe("BC+AC");
    done();
  }

  simplification.getSimplifiedExpression("(A+B)C", callback);
});

test("getSimplifiedExpression properly simplifies (A+A)+B", done => {
  function callback(response) {
    expect(response).toBe("B+A");
    done();
  }

  simplification.getSimplifiedExpression("(A+A)+B", callback);
});

test("getSimplificationSteps returns simplification steps for (AB+A)AA+AB+BA", done => {
  function callback(response) {
    expect(response).toEqual([
      new Simplification("AB+AAA+AAAB", "A OR A"),
      new Simplification("AB+A+AB", "A AND A"),
      new Simplification("A", "A + AB")
    ]);
    done();
  }

  simplification.getSimplificationSteps("(AB+A)AA+AB+BA", callback);
});

test("getSimplificationSteps returns simplification steps for A", done => {
  function callback(response) {
    expect(response).toEqual([]);
    done();
  }

  simplification.getSimplificationSteps("A", callback);
});

test("getSimplificationSteps returns simplification steps for (A1+0)A+AB", done => {
  function callback(response) {
    expect(response).toEqual([
      new Simplification("AB+0+1AA", "0 AND A"),
      new Simplification("AB+0+AA", "1 AND A (1A)"),
      new Simplification("AB+AA", "A OR 0"),
      new Simplification("AB+A", "A AND A"),
      new Simplification("A", "A + AB")
    ]);
    done();
  }

  simplification.getSimplificationSteps("(A1+0)A+AB", callback);
});
