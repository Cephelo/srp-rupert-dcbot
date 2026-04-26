const run = async () => {
    require("dotenv").config()

    let express = require('express');
    
    let http = require('http')
    let OAuth = require('oauth').OAuth
    let url = require('url')

    /*
    /     Express Server Setup
    */
    let app = express();

    app.use(express.static('public'));

    let server = app.listen(3000, function () {
    console.log('Server up and running...🏃🏃🏻');
    console.log("Listening on port %s", server.address().port);
    });

    /*
    /     OAuth Setup and Functions
    */
    const requestURL = "https://trello.com/1/OAuthGetRequestToken";
    const accessURL = "https://trello.com/1/OAuthGetAccessToken";
    const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
    const appName = "Rupert[DiscordBot]";
    const scope = 'read';
    const expiration = 'never';

    // Be sure to include your key and secret in 🗝.env ↖️ over there.
    // You can get your key and secret from Trello at: https://trello.com/app-key
    const key = process.env.TRELLO_API_KEY;
    const secret = process.env.TRELLO_OAUTH_TOKEN;

    // Trello redirects the user here after authentication
    const loginCallback = `https://trello.com/b/RiQBBFRB/scape-run-parasites-lone-version`; //https://${process.env.PROJECT_DOMAIN}.glitch.me/callback

    // You should have {"token": "tokenSecret"} pairs in a real application
    // Storage should be more permanent (redis would be a good choice)
    const oauth_secrets = {};

    const oauth = new OAuth(requestURL, accessURL, key, secret, "1.0A", loginCallback, "HMAC-SHA1")

    const login = function(request, response) {
    oauth.getOAuthRequestToken(function(error, token, tokenSecret, results){
        oauth_secrets[token] = tokenSecret;
        response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
    };

    let token, tokenSecret;

    let callback = function(req, res) {
    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const verifier = query.oauth_verifier;
    oauth.getOAuthAccessToken(token, tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results){
        // In a real app, the accessToken and accessTokenSecret should be stored
        oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, function(error, data, response){
        // Now we can respond with data to show that we have access to your Trello account via OAuth
        res.send(data)
        });
    });
    };

    /*
    /     Routes
    */
    app.get("/", function (request, response) {
    console.log(`GET '/' 🤠 ${Date()}`);
    response.send("<h1>Oh, hello there!</h1><a href='./login'>Login with OAuth!</a>");
    })

    app.get("/login", function (request, response) {
    console.log(`GET '/login' 🤠 ${Date()}`);
    login(request, response);
    })

    app.get("/callback", function (request, response) {
    console.log(`GET '/callback' 🤠 ${Date()}`);
    callback(request, response);
    })
}

module.exports = { run }
