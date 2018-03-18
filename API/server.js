var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var app = express()
var port = process.env.PORT || 3000;

// ROUTES
var simplify = require('./routes/simplifyRoutes');

app.listen(port);

app.use(bodyParser.json());
app.use('/simplify', simplify);
console.log("Running on port " + port);
