var _ = require('lodash');
var async = require('async');
var blogCache = require('./blogCache');
var blogFallbackCache = require('./blogFallbackCache');
var config = require('../config');
var InteractionCtr = require('../controller/interactionCtr');
var logger = require('../metrics').createTracker('blogCacheWithFallback');

function formatBlogs(blogs) {
  return _.map(blogs, function(blog) {
    return _.pick(blog, 'name', 'images', 'description');
  })
}

module.exports = function(cb) {
  var userObj = _.pick(this.user,
      'tumblrUsername', 'tumblrAccessToken', 'tumblrSecret');
  async.parallel({
 //    own: _.partial(blogCache.unseen.getLazy, userObj, userObj),
    own: _.partial(blogCache.getLazy, userObj),
    fallback: blogFallbackCache.inMemory.getOnce
  }, function (err, res) {
    if (err) {
      return cb(err);
    }
    var blogs = res.own && res.own.blogs || [];
    if (blogs.length < config.get('BLOG_FEED_FALLBACK_MAX_LENGTH')) {
      if (res.fallback && res.fallback.blogs && res.fallback.blogs.length) {
        blogs = blogs.concat(res.fallback.blogs);
        InteractionCtr.forUser(userObj).
            exclude.seen('blogs', blogs, function(err, unseen) {
              logger.info('blogCacheWithFallback-withFallback', {
                own: res.own && res.own.blogs && res.own.blogs.length || 0,
                fallback: res.fallback &&
                    res.fallback.blogs &&
                    res.fallback.blogs.length || 0
              })
              cb(null, formatBlogs(unseen));
            });
      } else {
        logger.error('blogCacheWithFallback-noFallback', {
          own: res.own && res.own.blogs && res.own.blogs.length || 0,
          fallback: 0
        });
        cb(null, formatBlogs(blogs))
      }
    } else {
      logger.info('blogCacheWithFallback-withoutFallback');
        cb(null, formatBlogs(blogs));
    }
  });
};