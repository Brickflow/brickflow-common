'use strict';
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var blogFallbackFeed = require('./blogFallbackFeed');

module.exports = feedCacheGenerator({
  key: 'blogFallback',
  fetch: blogFallbackFeed,
  format: function(blogs) {
    return { status: { success: true, blogFallback: true }, blogs: blogs };
  }
});