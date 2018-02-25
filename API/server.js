var express = require('express');
var app = express()
var port = process.env.PORT || 3000;

// ROUTES
var simplify = require('./routes/simplifyRoutes');

app.listen(port);

app.use('/simplify', simplify);
console.log("Running on port " + port);
