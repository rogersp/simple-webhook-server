var express = require('express');
var bodyParser  = require('body-parser');

var PORT = (process.env.PORT || 5000);
var HTTP_AUTH_B64_TOKEN = 'dXNlcjEyMzpwYXNzNzg5'; // user123:pass789
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

app.get('/', function(request, response) {
  response.send('Sample webhook server. Use POST methods instead of GET.')
  console.log('GET request received');
})

router.get('/test', function(req, res) {
    res.json({
        message: 'hi there!'
    });
})

router.post('/issue', function(req, res) {
    var auth = req.headers['authorization'];
    if (!auth) {
        res.status(401).send({ error: 'Authorization not provided'});
    }    
    if (auth !== 'Basic ' + HTTP_AUTH_B64_TOKEN) {
        res.status(401).send({ error: 'Invalid basic authorization' });
        return;
    }
    console.log('Received: ' + JSON.stringify(req.body));
    res.json({
        fulfillment: {
            source: "issue-webhook",
            displayText: "Thanks bunches!"
        }
    });
});

app.use('/webhook', router);
app.listen(PORT);
console.log('Webhook Server started... port: ' + PORT);
