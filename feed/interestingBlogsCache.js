'use strict';
var _ = require('lodash');
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var recommend = require('../service/recommend');
var User = require('../model/user');

module.exports = feedCacheGenerator({
  key: 'interestingBlogs',
  type: 'blogs',
  fetch: recommend.blogs,
  getter: function(user, key, cb) {
    User.findOne(_.pick(user, 'tumblrUsername'),
        { interestingBlogs: 1 }, cb);
  },
  setter: function(user, key, value, cb) {
    User.update(_.pick(user, 'tumblrUsername'),
        { interestingBlogs: value,
          interestingBlogsAt: new Date() }, { upsert: true }, cb);
  }
});