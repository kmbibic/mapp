var express = require("express");
var path = require('path');
var hbs = require('hbs');
var app = express();
var axios = require('axios');

var port = process.env.port || 4000;

var apiURL = "http://localhost:3000"

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));

// Homepage
app.get('/', function(req, res) {
    res.render('index');
});

app.get('/simplify', function(req, res) {
    console.log(req.query);
    let url = apiURL + "/simplify/"+req.query.expression +"/results"
    axios.get(url).then((response) => {
        res.end(response.data);
    })
})

app.listen(port);