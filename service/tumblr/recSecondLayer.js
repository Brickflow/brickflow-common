var _ = require('lodash'),
    async = require('async');
var getBlogPosts = require('./getBlogPosts'),
    logger = require('../../metrics').createTracker('tumblrRec');

function getSecondLayerForBlog(blogName, options, callbackFn) {
  if (typeof options === 'function') {
    callbackFn = options;
    options = {};
  }

  getBlogPosts(blogName, _.assign({
    type: 'photo',
    reblog_info: true
  }, options), function(err, tempPosts) {
    if(err) {
      return callbackFn(err);
    }

    var finalBlogs = {};
    _.each(tempPosts, function(post) {
      if (post.reblogged_from_name) {
        if (finalBlogs[post.reblogged_from_name]) {
          finalBlogs[post.reblogged_from_name].value++;
        } else {
          finalBlogs[post.reblogged_from_name] = {
            blogName: post.reblogged_from_name,
            type: 'reblog',
            value: 1
          };
        }
      }
    });
    if (_.keys(finalBlogs).length === 0) {
      logger.info('getBlogsByBlogName-no-2ndlayer-blogs', {
        numberOftempPosts: tempPosts.length
      });
    }
    callbackFn(null, finalBlogs);
  });
}


module.exports = function fetchSecondLayerBlogs(options, firstLayerBlogs, callback) {
  if (typeof firstLayerBlogs === 'function') {
    callback = firstLayerBlogs;
    firstLayerBlogs = options;
    options = {};
  }

  async.map(
      firstLayerBlogs,
      function(blog, cb) {
        getSecondLayerForBlog(
            blog.blogName,
            options,
            function(err, secondLayerBlogs) {
              blog.interestingBlogs = secondLayerBlogs;
              cb(err, err ? null : blog);
            }
        );
      },
      function(err, firstLayerBlogs) {
        callback(err, err ? null : firstLayerBlogs);
      }
  );
};
