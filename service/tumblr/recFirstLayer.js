'use strict';

var _ = require('lodash'),
    async = require('async');
var config = require('../../config'),
    metrics = require('../../metrics');
var logger = metrics.createTracker('tumblrRec'),
    funnelTracker = metrics.createFunnelTracker('recFunnel');
var getAPI = require('./getAPI'),
    getBlogPosts = require('./getBlogPosts');
var NO_CURRENT_USER = 'notLoggedInAtAll';

function parseFirstLayerBlogs(err, asyncResult, callbackFn) {
  if(err) {
    return callbackFn(err);
  }

  var finalBlogs = {};
  _.each(asyncResult.followeds.blogs, function(blog) {
    finalBlogs[blog.name] = {
      blogName: blog.name,
      following: true,
      reblogs: 0
    };
  });

  _(asyncResult.rebloggeds).filter(function(post) {
    return Boolean(post.reblogged_from_name);
  }).each(function(post) {
    if (finalBlogs[post.reblogged_from_name]) {
      finalBlogs[post.reblogged_from_name].reblogs++;
    } else {
      finalBlogs[post.reblogged_from_name] = {
        blogName: post.reblogged_from_name,
        following: false,
        reblogs: 1
      };
    }
  });
  logger.info('recFirstLayer-finalResult');
  callbackFn(null, _.values(finalBlogs));
}

/**
 * Get current user's reblogged and followed blogs w/ corresponding weight
 * @param user current user object for API auth.
 * @param callbackFn(err, result),
 *   result: [{'blog_name': {type: following|reblog, value}},...]
 */
module.exports = function getFirstLayerBlogs(user, options, callbackFn) {
  if (typeof options === 'function') {
    callbackFn = options;
    options = {};
  }

  if (user === undefined) {
    funnelTracker.start('recFirstLayer').step('no-user').end(false);
    return callbackFn(NO_CURRENT_USER);
  }
  var logInfo = {
    tumblrUsername: user.tumblrUsername,
    hasCallback: typeof callbackFn === 'function'
  };

  var funnel = funnelTracker.start('recFirstLayer', logInfo);
  async.series({
    followeds: function (cb) {
      funnel.step('getFolloweds');
      getAPI(user).following(function(err, res) {
        _.assign(logInfo, {
          task: 'followeds',
          err: err,
          stack: err ? err.stack : null
        });
        funnel.step('partialResult', logInfo).step('gotFolloweds', logInfo);
        cb(err, res);
      });
    },
    rebloggeds: function (cb) {
      funnel.step('getRebloggeds');
      getBlogPosts(
          user.tumblrUsername,
          _.assign(options, {reblog_info: true}),
          function(err, res) {
            funnel.step('gotRebloggeds');
            funnel.step('pratialResult', {
              task: 'rebloggeds',
              err: err,
              stack: err ? err.stack : null
            });
            cb(err, res);
          });
    }
  }, function(err, asyncResult) {
    funnel.step('rawResult', { err: err, stack: err ? err.stack : undefined });
    funnel.end(false);
    parseFirstLayerBlogs(err, asyncResult, callbackFn);
  });
};