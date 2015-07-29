'use strict';

var tagSearch = require('./tagSearch');
var async = require('async');
var config = require('../config');
var _ = require('lodash');
var transformFeed = require('./lib/transformFeed');

function firstTags(tags, limit) {
  return _.first(tags, limit || config.get('TUMBLR_HASHTAGS_LIMIT'));
}

module.exports = function(tags, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  options.timeout = 0;
  async.map(firstTags(tags, options.tagLimit), function(hashtag, cb) {
    tagSearch(hashtag.tag || hashtag.label, options, cb);
  }, function(err, responses) {
    var byProvider = transformFeed.groupAndLimitByProvider(
        _(responses).pluck('bricks').flatten().compact().value());
    var result = _(byProvider).values().flatten().
        sortBy(transformFeed.brickScoreDESC).value();
    return callback(err, err ? null : result);
  });
};
