'use strict';
var feedCacheGenerator = require('./lib/feedCacheGenerator');
var followBlogRecommendation = require('./followBlogRecommendation');

module.exports = feedCacheGenerator({
  key: 'blog',
  type: 'blogs',
  fetch: followBlogRecommendation,
  format: function(blogs) {
    return { status: { success: true }, blogs: blogs };
  }
});