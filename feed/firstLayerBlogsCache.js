'use strict';
var _ = require('lodash');
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var recFirstLayer = require('../service/tumblr/recFirstLayer');
var User = require('../model/user');

module.exports = feedCacheGenerator({
  key: 'firstLayerBlogs',
  type: 'blogs',
  fetch: recFirstLayer
});