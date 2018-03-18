var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var passport = require("passport");
var passportJWT = require("passport-jwt");
var users = require('./../Users.json');

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

module.exports = function(jwtOptions) {
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

    router.post('/login', validateLoginParameters, (req, res) => {
        let name = req.body.username;
        let password = req.body.password;

        // find user from database 
        let user = users[req.body.username];

        if (!user) {
            res.status(401).json({
                message: "no such user exists"
            })
        }

        // check if password matches
        if (user.password == req.body.password) {
            var payload = {id: user.id}; // should we use username or id??
            var token = jwt.sign(payload, jwtOptions.secretOrKey);
            res.json({message: "ok", token: token});
        } else {
            res.status(401).json({
                message: "incorrect password"
            })
        }
    })
    return router
};