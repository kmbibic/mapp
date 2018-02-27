var express = require("express");
var path = require('path');
var hbs = require('hbs');
var app = express();
var axios = require('axios');
var bodyParser = require('body-parser');

var port = process.env.port || 4000;

var apiURL = "http://localhost:3000"

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
            console.log(error);
            res.status(500).send(); 
        })

    // axios.post(requestURL, requestJSON)
    //     .then((responseResults) => {
    //         let result = response.data;

    //         res.end(response.data);
    //     })
    //     .catch((error) => {
 
    //     });
})

app.listen(port);