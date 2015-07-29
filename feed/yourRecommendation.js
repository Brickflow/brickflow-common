'use strict';
var async = require('async');
var _ = require('lodash');
var score = require('../service/recommendScorers');
var tumblr = require('../service/tumblr');
var interestingBlogsCache = require('./interestingBlogsCache');

module.exports = function(user, callback) {
  var callCount = 0;
  async.waterfall([
    _.partial(interestingBlogsCache.getSync,
        _.pick(user, 'tumblrUsername', 'tumblrAccessToken', 'tumblrSecret')),
    tumblr.getPostsForBlogs,
    _.partial(score.posts, user),
    function(posts, cb) { return cb(null, _.uniq(posts, 'reblog_key')); },
    function(posts, cb) { async.map(posts, tumblr.transformBrick, cb); },
    function(posts, cb) { cb(null, _(posts).flatten().compact().value()); }
  ], function(err, result) {
    if (callCount === 0) {
      callCount++;

      return callback(err, err ? null : {
        bricks: result,
        status: {
          your: result.length || 0
        }
      });
    }
  });
};
