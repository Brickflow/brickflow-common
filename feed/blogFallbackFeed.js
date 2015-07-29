'use strict';

var _ = require('lodash');
var async = require('async');

var UserCtr = require('../controller/userCtr');
var tumblr = require('../service/tumblr');

var blogFallbackFeed = function(callback) {
  UserCtr.getSomeUsers(100, function(err, users) {
    async.map(users, function(user, cb) {
      tumblr.getBlogInfo(user.tumblrUsername, function(err, blogInfo) {
        if (err) { return cb(err); }
        if (blogInfo.images.length === 0) { return cb(); }
        cb(null, _.assign(user, blogInfo));
      });
    }, function(err, blogs) {
      blogs = _.compact(blogs);
      callback(err ? err : null, {
        status: err ?
        { error: err.message, stack: err.stack } :
        { blogs: blogs.length },
        blogs: _.each(blogs, function(user) {
          _.assign(user, {
            name: user.tumblrUsername,
            origin: 'fallback'
          });
        })
      });
    });
  });
};

module.exports = blogFallbackFeed;
