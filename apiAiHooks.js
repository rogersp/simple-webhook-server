var express = require('express');
var config = require('./config');
var bitbucket = require('./bitbucket');
var _ = require('lodash');

// References
// api.ai webhook docs: https://docs.api.ai/docs/webhook#webhook-example
// slack + webhook integration example: https://docs.api.ai/docs/slack-webhook-integration-guideline

// set up a router to export
var router = express.Router();
var source = 'apiAiHooks';
var owner = config.bitbucket.owner;

// define a generic catch handler
var getCatchHandler = function(res) {
    return function(err) {
        res.json({
            error: err,
            data: {
                slack: getSlackMessage('An error occurred while processing your request')
            }
        });
    }
}

// work with repositories
router.post('/repo', function(req, res) {    
    bitbucket.listRepos(owner)
        .then(repos => repos.map(repo => repo.slug))
        .then(repos => {
                        
            var response = `Available repositories: ${repos.join(',')}`;
            var slack = getSlackMessage(response);

            res.json({
                speech: response,
                displayText: response,
                data: { slack },
                source
            });

        })
        .catch(getCatchHandler(res));   
});

// work with issues
router.post('/issue', function(req, res) {   
    console.log('incoming issue request: ', req.body);    

    var result = req.body.result || {};    
    var action = result.action;
    var params = result.parameters || {};

    switch (action) {

        case 'add_issue':
            handleAddIssue(req, res, params);
            break;                    

        default:
            handleUnknownIssueAction(req, res);
            break;

    }    
});

function getSlackMessage(msg, attachments) {
    return {
        text: msg,
        attachments
    };
}

function handleUnknownIssueAction(req, res) {
    let response = 'Unknown issue action';
    res.json({
        speech: response,
        displayText: response,
        data: { slack: getSlackMessage(response) },
        source
    });
}

function handleAddIssue(req, res, params) {

    console.log('handleAddIssue, params: ', params);    
    var otherParams = _.omit(params, 'repo');    

    bitbucket.postRepoIssue(params.repo, owner, otherParams) 
        .then(result => {
            
            var partialUri = result.resource_uri.replace('/1.0/repositories/', '');
            var response = `Successfully created issue #${result.local_id}`;
            var slack = getSlackMessage(response, [
                {
                    title: result.title,
                    title_link: `https://bitbucket.org/${partialUri}`
                }
            ]);

            res.json({
                speech: response,
                displayText: response,
                data: { slack },
                source
            });
        })
        .catch(getCatchHandler(res));  
}

module.exports = router;