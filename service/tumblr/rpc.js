'use strict';
var rpc = require('tumblr-rpc');
var config = require('../../config');
var logger = require('../../metrics').createTracker('tumblrRpcClient');

module.exports = {
  createClient: function(options) {
    options.url = config.get('private:RABBITMQ_URL');
    options.logger = logger;
    return rpc.createClient(options);
  }
};