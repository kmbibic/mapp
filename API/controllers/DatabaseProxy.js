var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

// set database connection info details
var db_conn_info = { 
    userName: 'MAPPAdmin', 
    password: 'MAPPfast1fast',  // theoretically this would be good to hide, but instructors need to access db too
    server: 'mapp.database.windows.net',
    options: {
        database: 'mappDB', 
        encrypt: true,
        rowCollectionOnRequestCompletion: true
    }
};



var jsonfile = require('jsonfile');
var SimplificationPrototype = require('../models/SimplificationPrototype')
const DATABASE_FILE_PATH = __dirname+"/../database.json";
const REFRESH_TOKEN_TABLE_NAME = "RefreshTokens"

var databaseResultsCache = {};
var databaseStepsCache = {};

function deepCopy(arr) {
    let newArr = [];

    for (var i in arr) {
        newArr.push(new SimplificationPrototype(arr[i]).clone());
    }

    return newArr;
}

function queryData(queryString, success, error) {
    var connection = new Connection(db_conn_info);
    
    connection.on('connect', function(err) {
        if (err) {
          error(err);
          connection.close();
        } else {
            var request = new Request(
                queryString,
                function(err, rowCount, rows) {
                    console.log(rowCount + ' row(s) returned');
                    if (err) {
                        error(new Error("Database query error: " + err.message));
                    } else {
                        success(rows);
                    }
                    
                    connection.close()
                }
            );
        
            // run the query request
            connection.execSql(request);
        }});
}

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

function getSimplificationsFromDatabase(expression) {
    return new Promise((resolve, reject) => {
        var SimplificationsSQLString = `
            WITH cte_all_simplification_steps (id, expression, step, simplification_rule)
            AS (
                SELECT id, expression, step, simplification_rule
                FROM Simplifications
                WHERE expression = '${expression}'
                UNION ALL
                SELECT S.id, S.expression, S.step, S.simplification_rule
                FROM Simplifications AS S, cte_all_simplification_steps
                WHERE cte_all_simplification_steps.step IS NOT NULL
                AND S.id = cte_all_simplification_steps.step
            )
            SELECT id, expression, step, simplification_rule
            FROM cte_all_simplification_steps;`
    
        queryData(
            SimplificationsSQLString,
            (rows) => {
                // iterate through result set if applicable
                if (rows.length == 0) {
                    return null;
                }

                var response = {
                    steps: [],
                    result: ""
                };

                for (i = 0; i < rows.length; i++) {
                    var simplification_step = {
                        step: rows[i][1].value,
                        rule: rows[i][3].value
                    };
                    response.steps.push(simplification_step);
                }

                response.result = rows[rows.length - 1][1].value;

                resolve(response);
            },
            (error) => {
                reject(error);
            }
        );
    })
}

function storeToCache(expression, data, steps, result) {
    // check whether in cache already
    if (getStepsAndResultFromObject(databaseStepsCache, expression)) {
        return;
    }

    let steps_deepCopy = deepCopy(steps); // deep copy of steps so changes to original object don't affect cache

    var newElements = {};
    var currentKey = expression;

    for (var i in steps_deepCopy) {
        let currentStep = steps_deepCopy[i];
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
    // console.log("Store to cache");
    // console.log(databaseStepsCache);
}

function writeToDatabase(requestString, success, error) {
    var connection = new Connection(db_conn_info);
    
    connection.on('connect', function(err) {
        if (err) {
            error(err);
            connection.close();
        } else {
            var request = new Request(
                requestString,
                function (err, rowCount) {
                    if (err) {
                        error(new Error("Error when writing to database: " + err.message));
                    } else {
                        console.log('inserted %d rows', rowCount);
                        success();
                    }

                    connection.close();
                });
        
            // run the query request
            connection.execSql(request);
        }});
}

function getUserIDFromUsername(username) {
    return new Promise((resolve, reject) => {
        var userIDSQLString = `
            SELECT user_id
            FROM Users
            WHERE username = '${username}';`
    
        queryData(
            userIDSQLString,
            (rows) => {
                if (rows.length == 0) {
                    return null;
                }
                resolve(rows[0][0].value)
            },
            (error) => {
                reject(error);
            }
        );
    })
}

exports.writeRefreshTokenToDatabase = function(refreshToken, username) {
    return new Promise((resolve, reject) => {
        getUserIDFromUsername(username).then((userID) => {
            var writeRefreshTokenSQLString = `
                INSERT INTO ${REFRESH_TOKEN_TABLE_NAME} (user_id, token)
                VALUES (${userID}, '${refreshToken}')
            `

            writeToDatabase(
                writeRefreshTokenSQLString,
                () => {
                    resolve()
                },
                (error) => {
                    reject(error);
                }
            );
            
        }).catch((error) => {
            reject(error);
        });
    });
        
}

function checkIfExpressionInDatabase(expression) {
    return new Promise((resolve, reject) => {
        var userIDSQLString = `
            SELECT *
            FROM Simplifications
            WHERE expression = '${expression}';`
    
        queryData(
            userIDSQLString,
            (rows) => {
                if (rows.length == 0) {
                    return null;
                }
                resolve(rows[0][0].value)
            },
            (error) => {
                reject(error);
            }
        );
    })
}

exports.writeSimplificationsToDatabase = function(expression, steps, result) {
    return new Promise((resolve, reject) => {
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

        var writeRefreshTokenSQLString = `
                INSERT INTO ${REFRESH_TOKEN_TABLE_NAME} (user_id, token)
                VALUES (${userID}, '${refreshToken}')
            `

        writeToDatabase(
            writeRefreshTokenSQLString,
            () => {
                resolve(true)
            },
            (error) => {
                reject(error);
            }
        );
    });
}

exports.writeToDatabase = function(expression, steps, result) {
    console.log("called writeToDatabase");

    return new Promise((resolve, reject) => {
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
    console.log("called getResults");
    return new Promise((resolve, reject) => {
        if (databaseResultsCache[expression]) {
            resolve(databaseResultsCache[expression]);
            return;
        }

        getSimplificationsFromDatabase(expression)
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

exports.getUserFromUsername = function(username) {
    return new Promise((resolve, reject) => {
        var userSQLString = `
            SELECT username, encrypted_password AS password, is_premium AS premium
            FROM Users
            WHERE username = '${username}'`

        queryData(userSQLString, (rows) => {
            if (rows.length == 0) {
                reject(new Error("No registered user under given username"))
            }
            var user = {
                "username": "",
                "password": "",
                "premium": false
            }

            rows[0].forEach((column) => {
                user[column.metadata.colName] = column.value
            })

            resolve(user)
        }, (error) => {
            reject(error)
        })
    });
}

exports.getUsernameFromRefreshToken = function(refreshToken) {
    return new Promise((resolve, reject) => {
        var usernameSQLString = `
            SELECT username
            FROM Users
            LEFT JOIN RefreshTokens
            ON Users.user_id = RefreshTokens.user_id
            WHERE token = '${refreshToken}'`

        queryData(usernameSQLString, (rows) => {
            if (!rows || !rows[0]) {
                reject(new Error("Not a valid refresh token"))
            }

            var username = rows[0][0].value

            resolve(username)
        }, (error) => {
            reject(error)
        })
    });
}

exports.getSteps = function(expression){
    console.log("called getSteps");
    // exports.writeRefreshTokenToDatabase("testtoken2", "harrypotter4242")
    // exports.getUserFromUsername("harrypotter4242").then((something) => {
    //     console.log(something);
    // }).catch((error) => {
    // })
    return new Promise((resolve, reject) => {
        if (databaseResultsCache[expression]) {
            var responseObject = getStepsAndResultFromObject(databaseStepsCache, expression);
            resolve(deepCopy(responseObject.steps));
            return;
        }

        getSimplificationsFromDatabase(expression)
            .then((databaseResponse) => {
                if (databaseResponse == null) {
                    resolve(null);
                    return;
                }

                // store to cache
                storeToCache(expression, databaseResponse.steps, databaseResponse.result);

                resolve(deepCopy(databaseResponse.steps));
            })
            .catch((err) => {
                reject(err);
            })
    })
}
// function queryStepsAndReesultFromDatabase(expression) {
//     console.log("Called queryStepsAndResultFromDatabase");
//     var currentStep = expression;
//     var response = {
//         steps: [],
//         result: ""
//     };

//     while (nextSimplification[step] && nextSimplification[simplification_rule]) {
//         var nextSimplification = queryRecords(`
//             SELECT step, simplification_rule, expression
//             FROM Simplifications
//             WHERE expression = '$(currentStep)'
//         `);

//         response.steps.push({"step": currentStep, "rule": nextSimplification[simplification_rule]});
//         currentStep = nextSimplification[expression];
//     }

//     return response;
// }

// function writeSimplificationToDatabase(expression, step, rule) { // how does this know what the step index is?
//     console.log("Called writeSimplificationToDatabase");
//     queryRecords(`
//         INSERT INTO Simplifications (step, expression, simplification_rule)
//         VALUES ($(step), '$(expression)', '$(rule)');
//     `);
// }

// function readResultsFromDatabase(expression) {
//     console.log("Called readResultsFromDatabase");
//     return new Promise((resolve, reject) => {
//         var connection = new Connection(db_conn_info);

//         connection.on('connect', function(err) {
//             if (err) {
//                 reject(err);
//                 return;
//             }
            
//             console.log('Connection to database was successful');
//             var simplifications = queryStepsAndResultFromDatabase(expression);
//         });
        
//         console.log(simplifications)
//         connection.close(); // does it make sense to close the db connection here?
//         return simplifications;
//     })
// }

// function storeToCache(expression, steps, result) {
//     console.log("Called storeToCache");
//     // check whether in cache already
//     if (readResultsFromDatabase(expression)) {
//         return;
//     }

//     let steps_deepCopy = deepCopy(steps); // deep copy of steps so changes to original object don't affect cache

//     var newElements = {};
//     var currentKey = expression;
    
//     for (var i in steps_deepCopy) {
//         let currentStep = steps_deepCopy[i];
//         // Set result for step
//         if (databaseResultsCache[currentKey]) {
//             return;
//         }
        
//         databaseResultsCache[currentKey] = result;
//         databaseStepsCache[currentKey] = currentStep;
        
//         currentKey = currentStep.step;
//     }
    
//     databaseResultsCache[currentKey] = result;
//     databaseStepsCache[currentKey] = {};
//     console.log("Store to cache");
//     console.log(databaseStepsCache);
// }

// exports.writeToDatabase = function(expression, steps, result) {  // this one's next!  need to make this write to the db and check that it does this correctly.
//     console.log("called writeToDatabase");

//     return new Promise((resolve, reject) => {
//         // May have some concurrency issues

//         // Check if already cached -> if already cached, it is in the database or in process of being in the database
//         if (databaseResultsCache[expression]) {
//             resolve(false);
//             return;
//         }

//         var databaseWriteObj = {};
//         var currentKey = expression;

//         storeToCache(expression, steps, result);

//         for (var i in steps) {
//             let currentStep = steps[i];
//             // Set result for step
//             databaseWriteObj[currentKey] = currentStep;

//             currentKey = currentStep.step;
//         }

//         databaseWriteObj[currentKey] = {};

//         readResultsFromDatabase(expression)
//             .then((result) => {
//                 let newDatabase = Object.assign({}, result, databaseWriteObj);
//                 writeSimplificationToDatabase(expression, step, rule, function (err) {
//                     if (err) {
//                         reject(err);
//                         return;
//                     }

//                     resolve(true);
//                 })
//             })
//             .catch((err) => {
//                 reject(err);
//             })

//     })
// }

// exports.getResults = function(expression){
//     console.log("called getResults");

//     return new Promise((resolve, reject) => {
//         if (databaseResultsCache[expression]) {
//             resolve(databaseResultsCache[expression]);
//             return;
//         }

//         readResultsFromDatabase(expression)
//             .then((databaseResponse) => {
//                 if (databaseResponse == null) {
//                     resolve(null);
//                     return;
//                 }

//                 // store to cache
//                 storeToCache(expression, databaseResponse.steps, databaseResponse.result)

//                 resolve(databaseResponse.result);
//             })
//             .catch((err) => {
//                 reject(err);
//             })
//     })
// }

// exports.getSteps = function(expression){
//     console.log("called getSteps");

//     return new Promise((resolve, reject) => {
//         if (databaseResultsCache[expression]) {
//             var responseObject = getStepsAndResultFromObject(databaseStepsCache, expression);
//             resolve(deepCopy(responseObject.steps));
//             return;
//         }

//         readResultsFromDatabase(expression)
//             .then((databaseResponse) => {
//                 if (databaseResponse == null) {
//                     resolve(null);
//                     return;
//                 }

//                 // store to cache
//                 storeToCache(expression, databaseResponse.steps, databaseResponse.result);

//                 resolve(deepCopy(databaseResponse.steps));
//             })
//             .catch((err) => {
//                 reject(err);
//             })
//     })
// }
