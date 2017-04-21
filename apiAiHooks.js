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
        console.log('getCatchHandler() err: ', err);
        res.json({
            error: err,
            data: {
                slack: getSlackMessage('An error occurred while processing your request: ' + err.message)
            }
        });
    }
}

router.get('/test', function(req, res) {
    bitbucket.listRepos(owner)
        .then(repos => {
            res.json(repos);
        })
        .catch(getCatchHandler(res));
})

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

        case 'list_repo':
            handleListRepo(req, res);
            break;

        case 'add_issue':
            handleAddIssue(req, res, params);
            break;          

        case 'list_issue':
            handleListIssue(req, res, params);   
            break;       

        default:
            handleUnknownIssueAction(req, res);
            break;

    }    
});

/**
 * For a given message and array of attachments, formulate a slack message.
 * 
 * @param {any} msg 
 * @param {any} attachments 
 * @returns 
 */
function getSlackMessage(msg, attachments) {
    return {
        text: msg,
        attachments
    };
}

/**
 * Slack date datetime formatter that will show dates in client local time.
 * 
 * @param {any} dateTimeString 
 * @returns 
 */
function getSlackDateTime(dateTimeString) {
    var timestamp = Date.parse(dateTimeString) / 1000;
    return `<!date^${timestamp}^{date_num} {time_secs}|${dateTimeString}>`;
}

/**
 * Turn a bitbucket relative resource into a complete URL
 * 
 * @param {any} uri 
 * @returns 
 */
function getUrlFromResourceUri(uri) {
    var partialUri = uri.replace('/1.0/repositories/', '');
    return `https://bitbucket.org/${partialUri}`;
}

/**
 * Webhook handler to display a list of repositories.
 * 
 * @param {any} req 
 * @param {any} res 
 */
function handleListRepo(req, res) {    
    console.log('handleListRepo()');

    bitbucket.listRepos(owner)
        .then(result => {            
            var response = `There are ${result.length} repositories`;
            var attachments = result.map(repo => {
                var updated = getSlackDateTime(repo.utc_last_updated);
                var issueTracker = repo.has_issues ? '*Issue Tracker*' : '';
                var fields = [{
                    title: 'Last Updated',
                    value: updated,
                    short: true
                }, {
                    title: 'Has Issues',
                    value: issueTracker,
                    short: true
                }];                                
                return {
                    title: repo.slug,
                    title_link: getUrlFromResourceUri(repo.resource_uri),             
                    text: `Updated: ${updated} ${issueTracker}`,                                       
                    color: repo.has_issues ? 'good' : null,
                    mrkdwn: true
                    //fields
                };
            });
            var slack = getSlackMessage(response, attachments);

            res.json({
                speech: response,
                displayText: response,
                data: { slack },
                source
            });
        })
        .catch(getCatchHandler(res));
}

/**
 * Webhook handler to display a list of issues. 
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} params 
 */
function handleListIssue(req, res, params) {    
    console.log('handleListIssue(), params: ', params);
    
    bitbucket.listRepoIssues(params.repo, owner)
        .then(result => {
            var response = `There are ${result.count} issues for repo '${params.repo}'`;
            var attachments = result.issues.map(issue => {
                var fields = [{
                    title: 'Assigned',
                    value: issue.responsible ? issue.responsible.display_name : 'None',
                    short: true
                }, {
                    title: 'Last Updated',
                    value: getSlackDateTime(issue.utc_last_updated),
                    short: true
                }];
                return { 
                    title: `${_.upperFirst(issue.metadata.kind)} #${issue.local_id}: ${issue.title}`,
                    title_link: getUrlFromResourceUri(issue.resource_uri),
                    thumb_url: issue.responsible ? issue.responsible.avatar : null,
                    color: issue.metadata.kind == 'bug' ? 'danger' : 'good',
                    fields
                };
            });
            var slack = getSlackMessage(response, attachments);

            res.json({
                speech: response,
                displayText: response,
                data: { slack },
                source
            });
        })
        .catch(getCatchHandler(res));
}

/**
 * Webhook handler to add a new bitbucket issue 
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} params 
 */
function handleAddIssue(req, res, params) {
    console.log('handleAddIssue(), params: ', params);    
    var otherParams = _.omit(params, 'repo');    

    bitbucket.postRepoIssue(params.repo, owner, otherParams) 
        .then(result => {
                        
            var response = `Successfully created issue #${result.local_id}`;
            var slack = getSlackMessage(response, [
                {
                    title: result.title,
                    title_link: getUrlFromResourceUri(result.resource_uri)
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

/**
 * Webhook handler for unknown action.
 * 
 * @param {any} req 
 * @param {any} res 
 */
function handleUnknownIssueAction(req, res) {
    let response = 'Unknown issue action';
    res.json({
        speech: response,
        displayText: response,
        data: { slack: getSlackMessage(response) },
        source
    });
}


module.exports = router;