'use strict';
var _ = require('lodash');
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var recommend = require('../service/recommend');
var User = require('../model/user');

module.exports = feedCacheGenerator({
  key: 'interestingHashtags',
  type: 'blogs',
  fetch: recommend.hashtags,
  getter: function(user, key, cb) {
    User.findOne(_.pick(user, 'tumblrUsername'),
        { hashtags: 1 }, cb);
  },
  setter: function(user, key, value, cb) {
    User.update(_.pick(user, 'tumblrUsername'),
        { hashtags: value }, { upsert: true }, cb)
  }
});