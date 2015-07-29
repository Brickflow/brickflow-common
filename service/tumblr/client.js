'use strict';
var config = require('../../config'),
    rpc = require('./rpc');
module.exports = rpc.createClient({
  consumer_key: config.get('private:TUMBLR_APP_KEY'),
  consumer_secret: config.get('private:TUMBLR_APP_SECRET')
});