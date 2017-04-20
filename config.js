require('dotenv').config();

module.exports = {
    bitbucket: {
        username: process.env.BITBUCKET_USERNAME,
        password: process.env.BITBUCKET_PASSWORD,
        owner: process.env.BITBUCKET_REPO_OWNER
    },
    httpAuth: {
        user: process.env.HTTP_AUTH_USER,
        pass: process.env.HTTP_AUTH_PASS
    }
}