var _ = require('lodash'),
    async = require('async')
var getBlogPosts = require('./getBlogPosts'),
    config = require('../../config');

module.exports = function(blogs, callback) {
  async.map(blogs, function(blog, cb) {
    if (! blog.blogName) {
      return cb(null, []);
    }
    getBlogPosts(blog.blogName, {
      type: 'photo',
      limit: config.get('TUMBLR_RECOMMENDATION_POSTS_LIMIT'),
      notes_info: true
    }, function(err, posts) {
      if (err) {
        logger.info('getPostsForBlogs-error', { stack:err.stack , blog:blog });
      }
      cb(err, posts);
    });
  }, function(err, postsByBlogs) {
    callback(null, _(postsByBlogs).flatten().uniq('post_url').value());
  });
};