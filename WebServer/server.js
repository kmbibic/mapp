var express = require("express");

// https imports
var https = require('https');
var http = require('http');
var forceSsl = require('express-force-ssl');

var path = require('path');
var hbs = require('hbs');
var app = express();
var axios = require('axios');
var bodyParser = require('body-parser');
var fs = require('fs');

var port = process.env.port || 4000;

// setup HTTPS
var key = fs.readFileSync('encryption/private.key');
var cert = fs.readFileSync( 'encryption/primary.crt' );
var ca = fs.readFileSync( 'encryption/intermediate.crt' );
var options = {
    key: key,
    cert: cert,
    ca: ca
  };


var apiURL = "https://localhost:3000"

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(forceSsl);

// Body validations
app.use('/simplify', function(req, res, next) {
    // Check that body exists
    if (req.body == undefined) {
        res.status(500).send({error: "No expression given"});
        return;
    }

    next();
})

app.post('/login', function(req, res, next) {

})

// Homepage
app.get('/', function(req, res) {
    res.render('index');
});

app.post('/simplify', function(req, res) {
    let requestURL = apiURL + "/simplify/results";
    let stepsURL = apiURL + "/simplify/steps"

    var requestResultFunction = function(response) {
        res.json(response.data);
    }

    var requestResultStepsFunction = function(response, steps) {
        res.json(Object.assign(response.data,steps.data));
    }

    let requestJSON = {expression: req.body.expression};

    var requests = [axios.post(requestURL, requestJSON)];
    var requestFunction = requestResultFunction;
    if (req.body.showSteps == true) {
        requests.push(axios.post(stepsURL, requestJSON));
        requestFunction = requestResultStepsFunction;
    }

    axios.all(requests)
        .then(axios.spread(requestFunction))
        .catch((error) => {
            console.log(error.data);
            var errorToSend = {error: "Server error"};
            if (error.response && error.response.data) {
                errorToSend = error.response.data;
            }
            res.status(500).send(errorToSend); 
        })
})

https.createServer(options, app).listen(port)
http.createServer(app).listen(port+1);