var express = require('express');
var bodyParser = require('body-parser');

// authentication imports
var jwt = require('jsonwebtoken');
var passport = require("passport");
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var app = express()
var port = process.env.PORT || 3000;

// ROUTES
var simplify = require('./routes/simplifyRoutes');
var authentication = require('./routes/authenticate');

app.listen(port);

app.use(bodyParser.json());
app.use('/simplify', simplify);
app.use('/authenticate', authentication);

// unsecured route
app.get('/', (req, res) => {
    res.json({
        _links: [
            {
                rel: "self",
                href: "http://localhost:3000" 
            },
            {
                rel: "authenticate",
                href: "http://localhost:3000/authenticate" 
            }
        ]
    })
})

console.log("Running on port " + port);
