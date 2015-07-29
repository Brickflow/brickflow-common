'use strict';
var _ = require('lodash');
var async = require('async');

var yourRecommendation = require('./yourRecommendation');
var hashtagRecommendation = require('./hashtagRecommendation');

var SearchCtr = require('../controller/searchCtr');
var logger = require('../metrics').createTracker('mixedRecommendation');
module.exports = function(user, callback) {
  async.series({
    your:    _.partial(yourRecommendation, user),
    hashtag: _.partial(hashtagRecommendation, user)
  }, function(err, res) {
    callback(err, err ? null : {
      bricks: SearchCtr.interleaveBricks(res.your.bricks||[], res.hashtag),
      status: {
        your: res.your && res.your.length,
        hashtag: res.hashtag && res.hashtag.length
      }
    });
  });
};