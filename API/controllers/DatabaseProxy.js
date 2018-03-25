var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var jsonfile = require('jsonfile');
var SimplificationPrototype = require('../models/SimplificationPrototype');

const DATABASE_FILE_PATH = __dirname+"/../database.json";
const REFRESH_TOKENS_TABLE_NAME = "RefreshTokens";
const USERS_TABLE_NAME = "Users";
const SIMPLIFICATIONS_TABLE_NAME = "Simplifications"

// set database connection info details
var db_conn_info = { 
    userName: 'MAPPAdmin', 
    password: 'MAPPfast1fast',  // this should be hidden, but is visible here so instructors can easily acccess the DB
    server: 'mapp.database.windows.net',
    options: {
        database: 'mappDB', 
        encrypt: true,
        rowCollectionOnRequestCompletion: true
    }
};

var databaseResultsCache = {};
var databaseStepsCache = {};

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

function getStepsAndResultFromObject(database, expression) {
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

function getSimplificationsFromDatabase(expression) {
    return new Promise((resolve, reject) => {
        var SimplificationsSQLString = `
            WITH cte_all_simplification_steps (id, expression, step, simplification_rule)
            AS (
                SELECT id, expression, step, simplification_rule
                FROM ${SIMPLIFICATIONS_TABLE_NAME}
                WHERE expression = '${expression}'
                UNION ALL
                SELECT S.id, S.expression, S.step, S.simplification_rule
                FROM ${SIMPLIFICATIONS_TABLE_NAME} AS S, cte_all_simplification_steps
                WHERE cte_all_simplification_steps.step IS NOT NULL
                AND S.id = cte_all_simplification_steps.step
            )
            SELECT id, expression, step, simplification_rule
            FROM cte_all_simplification_steps;`
    
        queryData(
            SimplificationsSQLString,
            (rows) => {
                if (rows.length == 0) {
                    resolve(null);
                    return;
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

function deepCopy(arr) {
    let newArr = [];

    for (var i in arr) {
        newArr.push(new SimplificationPrototype(arr[i]).clone());
    }

    return newArr;
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
    console.log("Store to cache");
    console.log(databaseStepsCache);
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

function getExpressionsNotInDatabase(expression) {
    return new Promise((resolve, reject) => {
        var expressionsSQLString = `
            SELECT *
            FROM ${SIMPLIFICATIONS_TABLE_NAME}
            WHERE expression = '${expression}';`
    
        queryData(
            userIDSQLString,
            (rows) => {
                if (rows.length == 0) {
                    resolve(null);
                    return;
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
        resolve(true);
        // var writeRefreshTokenSQLString = `
        //         INSERT INTO ${SIMPLIFICATIONS_TABLE_NAME} (user_id, token)
        //         VALUES (${userID}, '${refreshToken}')
        //     `

        // writeToDatabase(
        //     writeRefreshTokenSQLString,
        //     () => {
        //         resolve(true)
        //     },
        //     (error) => {
        //         reject(error);
        //     }
        // );
    });
}

exports.writeRefreshTokenToDatabase = function(refreshToken, username) {
    return new Promise((resolve, reject) => {
        exports.getUserFromUsername(username).then((user) => {
            var writeRefreshTokenSQLString = `
                INSERT INTO ${REFRESH_TOKENS_TABLE_NAME} (user_id, token)
                VALUES (${user.userID}, '${refreshToken}')
            `

            writeToDatabase(
                writeRefreshTokenSQLString,
                () => {
                    resolve()
                },
                (error) => {
                    reject(error.message);
                }
            );
            
        }).catch((error) => {
            reject(error);
        });
    });
        
}

exports.getUserFromUsername = function(username) {
    return new Promise((resolve, reject) => {
        var userSQLString = `
            SELECT user_id AS userID, username, encrypted_password AS password, is_premium AS premium
            FROM ${USERS_TABLE_NAME}
            WHERE username = '${username}'`

        queryData(userSQLString, (rows) => {
            if (rows.length == 0) {
                reject("No registered user under given username")
                return;
            }
            var user = {
                "userID": "",
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
            FROM ${USERS_TABLE_NAME}
            LEFT JOIN RefreshTokens
            ON Users.user_id = RefreshTokens.user_id
            WHERE token = '${refreshToken}'`

        queryData(usernameSQLString, (rows) => {
            if (!rows || !rows[0]) {
                reject("Not a valid refresh token")
                return;
            }

            var username = rows[0][0].value

            resolve(username)
        }, (error) => {
            reject(error)
        })
    });
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

exports.getSteps = function(expression){
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
