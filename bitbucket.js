var bitbucket = require('bitbucket-api');
var Promise = require('bluebird');
var config = require('./config');

// References
// BitBucket REST 1.0 endpoint: https://confluence.atlassian.com/bitbucket/issues-resource-296095191.html#issuesResource-POSTanewissue

var credentials = config.bitbucket;
var client = bitbucket.createClient(credentials);

// work with a promisified client
Promise.promisifyAll(client);

/**
 * Util to json pretty print object
 * @param {*} obj 
 */
var jsonPretty = function(obj) {
    return JSON.stringify(obj, null, 2);
}

/**
 * Helper function to get to the issues object for a repository.
 * Returns object with available methods: createAsync(), getByIdAsync(), getAsync(), updateAsync(), removeAsync()
 * 
 * @param {any} slug 
 * @param {any} owner 
 * @returns 
 */
function getRepoIssueClient(slug, owner) {
    return client.getRepositoryAsync({ slug, owner })
        .then(result => {
            var issues = result.issues();
            Promise.promisifyAll(issues, { context: issues });                        
            return issues;            
        });
}

/**
 * Post an issue to a repo
 * 
 * @param {any} slug 
 * @param {any} owner 
 * @param {object} issue in the form { title } with optional fields { kind, content, ..., status, priority, responsible, compoennt, milestone, version }
 */
function postRepoIssue(slug, owner, issue) {
    return getRepoIssueClient(slug, owner)
        .then(issues => issues.createAsync(issue))
        .then(result => {
            console.log('successfully created repo issue: ', jsonPretty(result));
            return result;            
        })
        .catch(err => {
            console.log('error creating repo issue: ', jsonPretty(err));
            throw err;
        });
}

/**
 * List the issues for a repo 
 * 
 * @param {any} slug 
 * @param {any} owner 
 */
function listRepoIssues(slug, owner) {
    return getRepoIssueClient(slug, owner)
        .then(issues => issues.getAsync())            
        .catch(err => {
            console.error('Error while listing repo issues: ', jsonPretty(err));
            throw err;
        });
}

/**
 * List the repos accessible.
 * 
 */
function listRepos(owner) {
    return client.repositoriesAsync()                
        .then(result => result.filter(repo => owner ? repo.owner == owner : true))
        /*            
        .then(result => result.map(repo => ({ 
            slug: repo.slug,
            owner: repo.owner        
        })))    
        */
        .catch(err => {
            console.error('Error while listing repos: ', jsonPretty(err));
        });
}

module.exports = {
    listRepos,
    postRepoIssue,
    listRepoIssues
};