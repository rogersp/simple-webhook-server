var bitbucket = require('./bitbucket');
var config = require('./config');

var owner = config.bitbucket.owner;

//bitbucket.listRepoIssues('web-ui', owner);
bitbucket.listRepos(owner).then(repos => console.log(JSON.stringify(repos, null, 2)));