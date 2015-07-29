'use strict';
var _ = require('lodash');
var async = require('async');
var config = require('../config');
var interestingHashtagsCache = require('./interestingHashtagsCache');
var multipleTagSearch = require('./multipleTagSearch');

function getActiveUserHashtags(user) {
  if (user && user.hashtags && user.hashtags.length) {
    return _.reject(user.hashtags, function(tag) {
      return tag.user === false;
    });
  } else {
    return [];
  }
}

function yourHashtagSearch(user, callback) {
  async.waterfall([
    _.partial(interestingHashtagsCache.getSync, user),
    _.partial(multipleTagSearch, user),
    function(posts, cb) {
      cb(null, _.first(posts, config.get('TUMBLR_HASHTAG_SEARCH_POSTS_LIMIT')));
    }
  ], callback);
}

module.exports = function(user, callback) {
  var activeTags = getActiveUserHashtags(user);
  if (activeTags.length) {
    multipleTagSearch(activeTags, {
      tumblr: false,
      user: user
    }, callback);
    interestingHashtagsCache.update(user);
  } else {
    yourHashtagSearch(user, callback);
  }
};