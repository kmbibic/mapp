var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy;
var CryptoJS = require("crypto-js");
var randtoken = require('rand-token');
var DatabaseProxy = require('./../controllers/DatabaseProxy');

var SECRET_KEY = "secretSecret4242SecretSecret"

// TEMP till Database
var refreshTokens = {}

module.exports = function(passport, jwtOptions, authentication) {
    // login strategy
    // function encryptPassword(password) {
    //     return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
    // }

    function decryptPassword(cipherText) {
        // let parsedText = CryptoJS.enc.Base64.parse(cipherText)
        let decryptedText = CryptoJS.AES.decrypt(cipherText, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        return decryptedText;
    }

    passport.use(new LocalStrategy({
            session: false
        },
        function(username, password, done) {
            // find user from database 
            DatabaseProxy.getUserFromUsername(username)
                .then((user) => {
                    let decryptedPassword = decryptPassword(user.password)
                    if (decryptedPassword == password) {
                        done(null, user)
                    } else {
                        done(null, false, "incorrect password");
                    }
                })
                .catch((err) => {
                    done(null, false);
                })
    }));

    function validateLoginParameters(req, res, next) {
        if (req.body.username && req.body.password) {
            next();
        } else {
            res.status(401).json({
                message: "did not provide required parameters", 
                neededParameters: {
                    username: "",
                    password: ""
                }
            });
        }
    }

    function createAccessToken(username) {
        var payload = {username: username}; // should we use username or id??
        var accessToken = jwt.sign(payload, jwtOptions.secretOrKey, {
            expiresIn: jwtOptions.expiresIn
        });
        return accessToken
    }

    function createRefreshToken(username, success, error) {
        var refreshToken = randtoken.uid(256);
        // store refresh token to database
        DatabaseProxy.writeRefreshTokenToDatabase(refreshToken, username)
            .then(() => {
                success(refreshToken)
            }).catch((error) => {
                error(new Error(error))
            })
    }

    function validateRefreshToken(accessToken, refreshToken, success, error) {
        DatabaseProxy.getUsernameFromRefreshToken(refreshToken).then((username) => {
            jwt.verify(accessToken, jwtOptions.secretOrKey, {ignoreExpiration:true}, (err, decoded) => {
                if (decoded && decoded.username == username) {
                    // valid refresh token
                    console.log("Create access token");
                    success(createAccessToken(username))
                } else {
                    error(new Error("Invalid refresh token"))
                }
            })
        }).catch((error) => {
            error(new Error(error));
        })
    }

    function extractJWT(authorization) {
        return authorization.split(' ')[1]
    }



    router.post('/login', validateLoginParameters, (req, res) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                res.status(401).json({
                    message: err
                })
            } else if (user) {
                createRefreshToken(user.username, (refreshToken) => {
                    res.json({
                        message: "ok", 
                        accessToken: createAccessToken(user.username),
                        refreshToken: refreshToken
                    });
                }, (err) => {
                    res.status(500).json({
                        message: "Unable to create refresh token"
                    });
                });
            }
        })(req, res);
    })

    router.get('/verifyToken', (req, res) => {
        if (req.headers.authorization) {
            jwt.verify(extractJWT(req.headers.authorization), jwtOptions.secretOrKey, (err, decode) => {
                if (err && err.name == "TokenExpiredError") {
                    res.json({
                        success: false,
                        tokenExpired: true
                    })
                } else if (err) {
                    res.json({
                        success: false,
                        tokenExpired: false
                    })
                } else {
                    res.json({
                        success: true,
                        tokenExpired: false
                    })
                }
            })
        } else {
            res.json({
                success: false
            })
        }
    })

    router.get('/userInfo', authentication, (req, res) => {
        res.json({
            premium: req.user.premium,
        })
    })

    router.post('/refreshToken', (req, res) => {
        if (req.body.accessToken && req.body.refreshToken) {
            let accessToken = req.body.accessToken;
            let refreshToken = req.body.refreshToken;

            validateRefreshToken(accessToken, refreshToken, (newAccessToken) => {
                res.json({
                    accessToken: newAccessToken
                })
            }, (error) => {
                res.status(400).send({
                    message: error.message
                })
            })
        } else {
            res.status(400).send({
                message: "No token given"
            })
        }
    })

    return router
};