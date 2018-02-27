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

// Homepage
app.get('/', function(req, res) {
    res.render('index');
});

app.post('/simplify', function(req, res) {
    let url = apiURL + "/simplify/results";
    console.log(req.body);

    axios.post(url, req.body)
        .then((response) => {
            res.end(response.data);
        })
        .catch((error) => {
            console.log(error.response.data);
            res.status(500).send(error.response.data);  
        });
})

app.listen(port);