'use strict';
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var trendingFeed = require('./trendingFeed');

module.exports = feedCacheGenerator({
  key: 'trending',
  fetch: trendingFeed,
  format: function(bricks) {
    return {status: {success: true}, bricks: bricks};
  }
});