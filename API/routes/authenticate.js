var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy;
var users = require('./../Users.json');
var CryptoJS = require("crypto-js");
var randtoken = require('rand-token');
var DatabaseProxy = require('./../controllers/DatabaseProxy');

var SECRET_KEY = "secretSecret4242SecretSecret"

// TEMP till Database
var refreshTokens = {}

module.exports = function(passport, jwtOptions, authentication) {
    // login strategy
    passport.use(new LocalStrategy({
            session: false
        },
        function(username, password, done) {
            // find user from database 
            DatabaseProxy.getUserFromUsername(username)
                .then((user) => {

                })
                .catch((err) => {

                })
                
            if (!user) {
                done(null, false, "no such user exists");
            }

            if (user.password == password) {
                done(null, user)
            } else {
                done(null, false, "incorrect password");
            }

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

    function createAccessToken(userID) {
        var payload = {id: userID}; // should we use username or id??
        var accessToken = jwt.sign(payload, jwtOptions.secretOrKey, {
            expiresIn: jwtOptions.expiresIn
        });
        return accessToken
    }

    function createRefreshToken(userID, success, error) {
        var refreshToken = randtoken.uid(256);
        // store refresh token to database
        DatabaseProxy.saveRefreshTokenInDatabase(refreshToken, userID)
            .then(() => {
                success(refreshToken)
            }).catch((error) => {
                error(error)
            })
    }

    function validateRefreshToken(accessToken, refreshToken, success, error) {
        DatabaseProxy.getUsernameFromRefreshToken(refreshToken).then((userID) => {
            jwt.verify(accessToken, jwtOptions.secretOrKey, {ignoreExpiration:true}, (err, decoded) => {
                if (decoded && decoded.id == userID) {
                    // valid refresh token
                    console.log("Create access token");
                    success(createAccessToken(userID))
                } else {
                    error(new Error("Invalid refresh token"))
                }
            })
        }).catch((error) => {
            error(error);
        })
    }

    function extractJWT(authorization) {
        return authorization.split(' ')[1]
    }

    function encryptPassword(password) {
        return CryptoJS.AES.encrypt(password, SECRET_KEY);
    }

    function decryptPassword(cipherText) {
        return CryptoJS.AES.decrypt(ciphertext.toString(), SECRET_KEY).toString(CryptoJS.enc.Utf8);
    }

    router.post('/login', validateLoginParameters, (req, res) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                res.status(401).json({
                    message: err
                })
            } else if (user) {
                createRefreshToken(user.id, (refreshToken) => {
                    res.json({
                        message: "ok", 
                        accessToken: createAccessToken(user.id),
                        refreshToken: createRefreshToken(user.id)
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