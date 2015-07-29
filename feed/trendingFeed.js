'use strict';
var _ = require('lodash');
var async = require('async');
var transformFeed = require('./lib/transformFeed');
var tumblr = require('../service/tumblr');
var twitter = require('../service/twitter');
var vine = require('../service/vine');
var instagram = require('../service/instagram');

module.exports = function(callback) {
  async.parallel({
    tumblr: function(cb) {
      async.waterfall([_.partial(tumblr.search, 'art'), tumblr.filterNsfw], cb);
    },
    twitter:   twitter.trending,
    vine:      vine.popular,
    instagram: instagram.popular
  }, function(err, responses) {
    callback(err, err ? null : {
      bricks: transformFeed.scoreAsyncParallelResponse(responses)
    });
  });
};