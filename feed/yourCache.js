'use strict';
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var mixedRecommendation = require('./mixedRecommendation');

module.exports = feedCacheGenerator({
  key: 'your',
  fetch: mixedRecommendation,
  format: function(bricks) {
    return { status: { success: true }, bricks: bricks };
  }
});