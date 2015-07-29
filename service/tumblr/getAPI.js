var rpc = require('./rpc');
var logger = require('../../metrics').createTracker('tumblr'),
    config = require('../../config');

module.exports = function getAPI(user) {
  return rpc.createClient({
    consumer_key: config.get('private:TUMBLR_APP_KEY'),
    consumer_secret: config.get('private:TUMBLR_APP_SECRET'),
    token: user.tumblrAccessToken,
    token_secret: user.tumblrSecret,
    logger: logger
  });
};