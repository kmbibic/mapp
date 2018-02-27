var fs = require("fs");

const DATABASE_FILE_PATH = "/.../database.txt"; // not sure where this will actually be just yet

function storeQueryStepsAndResult(initialQuery, simplificationSteps) {
  var allSteps = simplificationSteps.slice(); // Copy SimplificationSteps so it isn't modified in place (dunno if this is super important)
  allSteps.unshift(initialQuery); // prepend the initial query so we don't have to check it separately

  for (i = 0; i < allSteps.length - 1; i++) {
    if (!allSteps[i].getQueryStepsAndResult) { // this works, right?  checking if not a truthy element?
      addToDatabase(allSteps[i], simplificationSteps.slice(i + 1));
    }
  }
}

function getQueryStepsAndResult(query) {
  fs.readFile(DATABASE_FILE_PATH, "utf8", )  // how do we access this like a dictionary and not a blob of text?
  // ping database with query.
  return [query, result, simplificationSteps]
}

function addToDatabase(query, simplificationSteps) {
  var result = simplificationSteps[simplificationSteps.length - 1];
  fs.appendFileSync(DATABASE_FILE_PATH, query + ": [" + result + ", " + simplificationSteps + "],\n"); // query: [result, simplificationSteps], // also dunno how to do this asynchronously
  // OOORRRRR: dunno which is better
  var stream = fs.createWriteStream(DATABASE_FILE_PATH, {flags:'a'});
  stream.write(query + ": [" + result + ", " + simplificationSteps + "],\n");
  stream.end();
}

// 2 datasets: 1 for steps, 1 for results so we have O(1) lookup for both endpoints
// or just 1, where key is the intermediate step and value is list containing list of steps and final result (final result technically not necessary though)
