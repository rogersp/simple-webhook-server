var express = require('express');
var bodyParser  = require('body-parser');
var config = require('./config');
var apiAiHooks = require('./apiAiHooks');

var PORT = (process.env.PORT || 5000);
var HTTP_AUTH_B64_TOKEN = new Buffer(`${config.httpAuth.user}:${config.httpAuth.pass}`).toString("base64");

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function(request, response) {
  response.send('Hello!');
  console.log('GET request received');
});

// set up basic auth middleware
var authMiddleware = function(req, res, next) {
    var auth = req.headers['authorization'];
    if (!auth) {
        res.status(401).send({ error: 'Authorization not provided'});
        return;
    }    
    if (auth !== 'Basic ' + HTTP_AUTH_B64_TOKEN) {
        res.status(401).send({ error: 'Invalid basic authorization' });
        return;
    }
    next();
}

// use router under /webhook url prefix
app.use('/apiai', authMiddleware, apiAiHooks);

// start listening
app.listen(PORT);
console.log('Webhook Server started... port: ' + PORT);
