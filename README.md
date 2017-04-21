# simple-webhook-server

Based off [thousandeyes/simple-webhook-server](https://github.com/thousandeyes/simple-webhook-server.git).

Current purpose: accept webhook posts from [api.ai](http://api.ai), interacting with Bitbucket and Slack along the way.

For information This application support the [Getting Started with Node on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs) article - check it out.

## Running Locally

```sh
$ git clone https://github.com/rogersp/simple-webhook-server.git # or clone your own fork
$ cd simple-webhook-server
```

Copy `.env.sample` to `.env` and modify as desired.

```
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```
$ heroku create
```

Now go modify Config Vars in Heroku app settings, using `.env.sample` as a guide.

```
$ git push heroku master
$ heroku open
$ heroku logs --tail
```