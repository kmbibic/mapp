var express = require('express');
var bodyParser = require('body-parser');

// authentication imports
var jwt = require('jsonwebtoken');
var passport = require("passport");
var passportJWT = require("passport-jwt");
var UserCredentials = require('./authentication/UserCredentials');

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var app = express()
var port = process.env.PORT || 3000;

var users = require('./Users.json');

// authentication strategy setup
var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = "syde322IsAwesome4242"
jwtOptions.expiresIn = "15m"

var jwtStrategy = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    // add database here 
    var user = users[jwtPayload.id];

    if (user) {
        next(null, new UserCredentials(user.id, user.premium));
    } else {
        next(null, false);
    }
});
passport.use(jwtStrategy);
app.use(passport.initialize());

// ROUTES
var simplify = require('./routes/simplifyRoutes');
var authentication = require('./routes/authenticate')(passport, jwtOptions, passport.authenticate('jwt', {session: false}));

app.listen(port);

app.use(bodyParser.json());
app.use('/simplify', passport.authenticate('jwt',{session: false}))
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
                rel: "login",
                href: "http://localhost:3000/authenticate/login" 
            }
        ]
    })
})

console.log("Running on port " + port);
