var express = require("express");
var cookieParser = require('cookie-parser')

// authentication imports
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var path = require('path');
var hbs = require('hbs');
var app = express();
var axios = require('axios');
var bodyParser = require('body-parser');
var fs = require('fs');

var port = process.env.port || 4000;
var apiURL = "http://localhost:3000";
var serverURL = "http://localhost:" + port;

app.use(passport.initialize());
app.use(cookieParser());

const COOKIE_ACCESS_TOKEN = "mappAccessToken"
const COOKIE_REFRESH_TOKEN = "mappRefreshToken"

const EXPIRED_TOKEN_ERROR = "Expired token"

// setup authentication 
passport.use(new LocalStrategy({
        session: false
    },
    function(username, password, done) {
        axios({
            method: 'post',
            url: apiURL + '/authenticate/login',
            data: {
                username: username,
                password: password
            },
        }).then((res) => {
            return done(null, res.data)
        }).catch((error) => {
            return done(null, false, error)
        })
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


// Body validations
app.use('/simplify', function(req, res, next) {
    // Check that body exists
    if (req.body == undefined) {
        res.status(500).send({error: "No expression given"});
        return;
    }

    next();
})

// Check whether a user has an auth token and whether that token is valid
var checkAuthorization = (req, success, error) => {
    if (req.cookies && req.cookies[COOKIE_ACCESS_TOKEN]) {
        axios({
            method: 'get',
            url: apiURL + '/authenticate/verifyToken',
            headers: {
                'Authorization': 'Bearer ' + req.cookies[COOKIE_ACCESS_TOKEN]   
            },
        }).then((response) => {
            if (!response || !response.data) {
                error(new Error("Invalid token"))
                return
            }

            if (response.data.success) {
                success()
            } else if(response.data.tokenExpired) {
                error(new Error(EXPIRED_TOKEN_ERROR));
            } else {
                error(new Error("Invalid token"))
            }
        }).catch((errorMsg) => {
            error(errorMsg)
        })
    } else {
        error(new Error("No access token provided"))
    }
}

var refreshToken = (req, success, error) => {
    if (req && req.cookies && req.cookies[COOKIE_ACCESS_TOKEN] && req.cookies[COOKIE_REFRESH_TOKEN]) {
        axios({
            method: 'post',
            url: apiURL + '/authenticate/refreshToken',
            data: {
                accessToken: req.cookies[COOKIE_ACCESS_TOKEN],
                refreshToken: req.cookies[COOKIE_REFRESH_TOKEN]
            }
        }).then((response) => {
            if(response && response.data && response.data.accessToken) {
                success(response.data.accessToken)
            } else {
                error(new Error("Unable to refresh token"))
            }
        }).catch((errorMsg) => {
            error(errorMsg)
        })
    } else {
        error(new Error("No access token provided"))
    }
}

// Check whether a user has an auth token and whether that token is valid that can be path as part of express flow
var verifyAuthorization = (req, res, next) => {
    // contains a token header
    checkAuthorization(req, () => {
        // success
        next()
    }, (error) => {
        // error 
        let errorFlow = () => {
            res.clearCookie(COOKIE_ACCESS_TOKEN);
            res.clearCookie(COOKIE_REFRESH_TOKEN);
            if (req.method == "POST") {
                res.status(403).send({
                    redirect: true,
                    redirectURL: '/login'
                })
            } else {
                res.redirect('/login')
            }
        }

        if (error.message == EXPIRED_TOKEN_ERROR) {
            refreshToken(req, (accessToken) => {
                req.cookies[COOKIE_ACCESS_TOKEN] = accessToken;
                res.cookie(COOKIE_ACCESS_TOKEN, accessToken);
                next()
            }, (error) => {
                errorFlow()
            })
        } else {
            errorFlow()
        }
    })
}

// Get user information
var getUserInformation = (req, res, next) => {
    axios({
        method: 'get',
        url: apiURL + '/authenticate/userInfo',
        headers: {
            "Authorization": 'Bearer ' + req.cookies[COOKIE_ACCESS_TOKEN]   
        },
    }).then((response) => {
        req.user = response.data
        next()
    }).catch((error) => {
        serverResponseError(res, error)
    })
}

// Homepage
app.get('/', verifyAuthorization, getUserInformation, function(req, res) {
    res.render('index', {user: req.user});
});

app.get('/login', (req, res) => {
    checkAuthorization(req, () => {
       res.redirect('/') 
    }, (error) => {
        res.render('login');
    })
})

app.post('/login', (req, res) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            serverResponseError(res, err)
            return
        } 

        if (user) {
            res.cookie(COOKIE_ACCESS_TOKEN, user.accessToken);
            res.cookie(COOKIE_REFRESH_TOKEN, user.refreshToken);
            res.redirect('/');
        } else {
            res.status(400).json({
                error: "Incorrect username or password"
            })
        }
    })(req, res);
})

app.post('/simplify', verifyAuthorization, function(req, res) {
    let requestURL = apiURL + "/simplify/results";
    let stepsURL = apiURL + "/simplify/steps"

    function generatePostRequest(URL, request, data) {
        return {
            method: 'post',
            url: URL,
            data: data,
            headers: {
                Authorization: 'Bearer ' + request.cookies[COOKIE_ACCESS_TOKEN]
            }
        }
    }

    var requestResultFunction = function(response) {
        res.json(response.data);
    }

    var requestResultStepsFunction = function(response, steps) {
        res.json(Object.assign(response.data,steps.data));
    }

    let requestJSON = {expression: req.body.expression};

    var requests = [axios(generatePostRequest(requestURL, req, requestJSON))];
    var requestFunction = requestResultFunction;
    if (req.body.showSteps == true) {
        requests.push(axios(generatePostRequest(stepsURL, req, requestJSON)));
        requestFunction = requestResultStepsFunction;
    }

    axios.all(requests)
        .then(axios.spread(requestFunction))
        .catch((error) => {
            serverResponseError(res, error)
        })
})

app.get('/logout', (req, res) => {
    res.clearCookie(COOKIE_ACCESS_TOKEN);
    res.clearCookie(COOKIE_REFRESH_TOKEN);
    res.redirect('/login')
})

function serverResponseError(res, error) {
    console.log(error.data);
    var errorToSend = {error: "Server error"};
    if (error.response && error.response.data) {
        errorToSend = error.response.data;
    }
    res.status(500).send(errorToSend); 
}

app.listen(port)