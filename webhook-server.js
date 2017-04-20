var express = require('express');
var bodyParser  = require('body-parser');
var restClient = require('node-rest-client').Client;

var PORT = (process.env.PORT || 5000);
//var SECURITY_TOKEN = '12345';
var HTTP_AUTH_B64_TOKEN = 'dXNlcjEyMzpwYXNzNzg5'; // user123:pass789
var TARGET_HOOK = 'https://hooks.slack.com/services/<my target>';
var te_img = 'https://s3.amazonaws.com/uploads.hipchat.com/6634/194641/uncYbgVEMQ1XNtk/TE-Eye-36x36.jpg';
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

app.get('/', function(request, response) {
  response.send('This the ThousandEyes simple Webhook server sample.  Use POST methods instead of GET.')
  console.log('GET request received');
})

router.get('/test', function(req, res) {
    res.json({
        message: 'hi there!'
    });
})

router.post('/issue', function(req, res) {
    /*
    if (req.params.token !== SECURITY_TOKEN) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }
    */
    if (req.query.httpAuth && req.headers['authorization'] !== 'Basic ' + HTTP_AUTH_B64_TOKEN) {
        res.status(401).send({ error: 'Unauthorized for http basic' });
        return;
    }
    console.log('Received: ' + JSON.stringify(req.body));
    var restCall = new restClient();
    var hookBody = translateHookContent_slack(req);
    var args = {data: hookBody,headers:{"Content-Type": "application/json"}};
    restCall.post(TARGET_HOOK, args, function(data,response) {
        console.log('Sending to destination hook: ' + JSON.stringify(args));
        res.status(response.statusCode).send(response.statusMessage);
    });    
});

app.use('/webhook', router);
app.listen(PORT);
console.log('Webhook Server started... port: ' + PORT);
