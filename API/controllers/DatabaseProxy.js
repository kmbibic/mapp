var jsonfile = require('jsonfile');

const DATABASE_FILE_PATH = __dirname+"/../database.json";

var databaseResultsCache = {};
var databaseStepsCache = {};

function getStepsAndResultFromObject(database, expression){
    if (database == {}) {
        return null;
    }

    if (!database[expression]) {
        return null;
    }

    var response = {
        steps: [],
        result: ""
    };
    var currentStep = expression;

    while (database[currentStep] && Object.keys(database[currentStep]) != 0) {
        let nextStep = database[currentStep];
        response.steps.push(nextStep);
        currentStep = nextStep.step;
    } 

    response.result = currentStep;
    return response; 
}

function readDatabase() {
    return new Promise((resolve, reject) => {
        jsonfile.readFile(DATABASE_FILE_PATH, (err, database) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(database);
        });
    })
}

function getValueFromDatabase(key) {
    return new Promise((resolve, reject) => {
        readDatabase()
            .then( (database) => {
                resolve(getStepsAndResultFromObject(database, key));
            })
            .catch( (err) => {
                reject(err);
                return;
            })
    })
}

function storeToCache(expression, steps, result) {
    // check whether in cache already
    if (getStepsAndResultFromObject(databaseStepsCache, expression)) {
        return;
    }

    var newElements = {};
    var currentKey = expression;

    for (var i in steps) {
        let currentStep = steps[i];
        // Set result for step
        if (databaseResultsCache[currentKey]) {
            return;
        }

        databaseResultsCache[currentKey] = result;
        databaseStepsCache[currentKey] = currentStep;

        currentKey = currentStep.step;
    }

    databaseResultsCache[currentKey] = result;
    databaseStepsCache[currentKey] = {};
}

exports.writeToDatabase = function(expression, steps, result) {
    return new Promise((resolve, reject) => {
        // May have some concurrency issues
        
        // Check if already cached -> if already cached, it is in the database or in process of being in the database
        if (databaseResultsCache[expression]) {
            resolve(false);
            return;
        }

        var databaseWriteObj = {};
        var currentKey = expression;

        storeToCache(expression, steps, result);

        for (var i in steps) {
            let currentStep = steps[i];
            // Set result for step
            databaseWriteObj[currentKey] = currentStep;

            currentKey = currentStep.step;
        }

        databaseWriteObj[currentKey] = {};

        readDatabase()
            .then((database) => {
                let newDatabase = Object.assign({}, database, databaseWriteObj);
                jsonfile.writeFile(DATABASE_FILE_PATH, newDatabase, function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(true);
                })
            })
            .catch((err) => {
                reject(err);
            })

    })
}

exports.getResults = function(expression){
    return new Promise((resolve, reject) => {
        if (databaseResultsCache[expression]) {
            resolve(databaseResultsCache[expression]);
            return;
        }

        getValueFromDatabase(expression)
            .then((databaseResponse) => {
                if (databaseResponse == null) {
                    resolve(null);
                    return;
                }

                // store to cache
                storeToCache(expression, databaseResponse.steps, databaseResponse.result)

                resolve(databaseResponse.result);
            })
            .catch((err) => {
                reject(err);
            })
    })
}

exports.getSteps = function(expression){
    return new Promise((resolve, reject) => {
        if (databaseResultsCache[expression]) {
            resolve(getStepsAndResultFromObject(databaseStepsCache, expression).steps);
            return;
        }

        getValueFromDatabase(expression)
            .then((databaseResponse) => {
                if (databaseResponse == null) {
                    resolve(null);
                    return;
                }

                // store to cache
                storeToCache(expression, databaseResponse.steps, databaseResponse.result)

                resolve(databaseResponse.steps);
            })
            .catch((err) => {
                reject(err);
            })
    })
}


