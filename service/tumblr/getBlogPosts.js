var _  = require('lodash'),
    async = require('async'),
    asyncWithTimeout = require('async-timeout');
var logger = require('../../metrics').createTracker('tumblr'),
    config = require('../../config');
var client = require('./client');
var limit = config.get('TUMBLR_CLIENT_POSTS_LIMIT');

module.exports = function(blogName, tumblrQueryParams, callbackFn) {
  tumblrQueryParams = tumblrQueryParams || {};
  var postsTimeout = (tumblrQueryParams.timeout === undefined) ?
      config.get('TUMBLR_GET_BLOG_POSTS_TIMEOUT') : tumblrQueryParams.timeout;

  tumblrQueryParams.timeout = undefined;
  tumblrQueryParams.limit = tumblrQueryParams.limit || limit;
  var pageLimit = 1,
      pageParams = [];

  if(tumblrQueryParams.limit > limit) {
    pageLimit = Math.ceil(tumblrQueryParams.limit / limit);
    tumblrQueryParams.limit = limit;
  }

  for(var i = 0; i < pageLimit; i++) {
    var tempTumblrQueryParams = _.clone(tumblrQueryParams, true);
    tempTumblrQueryParams.offset = limit * i;
    pageParams.push({blogName: blogName,
      tumblrQueryParams: tempTumblrQueryParams});
  }

  async.map(pageParams, asyncWithTimeout(function(params, cb) {
    if (! params.blogName) {
      logger.info('getBlogPosts-noBlogName', {params: params});
      return cb(null, []);
    }
    client.posts(params.blogName, params.tumblrQueryParams, function(err, resp){
      if (err && err.message.match('404 Not Found') !== null) {
        logger.info('getBlogPosts-404blog', {
          blogName: blogName
        });
        cb(null, []); // blog was renamed or deactivated
      } else {
        if (err) {
          logger.info('getBlogPosts-err', {
            errobj: err,
            stack: err.stack,
            blogName: blogName
          });
          return cb(null, []);
        }
        cb(err, err ? null :
            _.filter(resp.posts, function (post) {
              return post.type === 'video' || (
                  post.photos && post.photos.length === 1);
            }));
      }
    });
  }, postsTimeout, []), function(err, asyncResult) {
    callbackFn(err, _(asyncResult).flatten().compact().value());
  }
  );
};
