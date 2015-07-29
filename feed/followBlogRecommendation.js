'use strict';
/* jshint ignore:start */

var _ = require('lodash');
var async = require('async');
var config = require('../config');

var asyncWithTimeout = require('async-timeout');

var logger = require('../metrics').createTracker('recFollowBlogs');
var funnelTracker = require('../metrics').createFunnelTracker('recFollowBlogs');

//var solrBlog = require('../model/solr/blog');

var UserCtr = require('../controller/userCtr');
var InteractionCtr = require('../controller/interactionCtr');

var tumblr = require('../service/tumblr');
var featureSwitch = require('../featureSwitch');

var brickflowBlogs = function(user, callback) {
  var logInfo = {
    tumblrUsername: user.tumblrUsername
  };
  logger.info('recFollowBlogs-getBrickflowBlogs', logInfo);
  logger.info('recFollowBlogs-partialResult', logInfo);
  var blogs = [{ name: 'brickflow', origin: 'brickflow' }];

  if (user && featureSwitch.userHasFeature(user, 'ryanContentExperiment')) {
    blogs.unshift({name: 'rajenur', origin: 'ryanContentExperiment'});
  }

  callback(null, blogs);
};

var getInterestingBlogs = function(user, callback) {
  callback(null, _(user.interestingBlogs).map(function(blog) {
    return _.assign(blog, {
      name: blog.blogName ? blog.blogName : blog.name,
      origin: 'interestingBlogs'
    });
  }).
      value());
};

var getSomeUsers = function(user, callback) {
  UserCtr.getSomeUsers(function(err, res) {
    callback(null, err ? null :
        _(res).reject(function(item) {
          return user.tumblrUsername === item.tumblrUsername ||
              _.contains(user.followedBlogs, item.tumblrUsername);
        }).map(function(u) {
          return {
            name: u.tumblrUsername,
            origin: 'random'
          };
        }).value());
  });
};

var getUsersWithSimilarHashtags = function(user, callback) {
  UserCtr.getUnfollowedUsersWithSimilarHashtags(
      user,
      _(user.hashtags).
          first(50).
          pluck('label').
          value(),
      function(err, users) {
        callback(null, err ? null :
            _(users).map(function(user) {
              return {
                name: user.tumblrUsername,
                origin: 'similarHashtags'
              };
            }).value());
      }
  );
};

//var solrBrickflowUsers = function(user, callback) {
//  solrBlog.recommend(_.pick(user, 'tumblrUsername'), function(err, blogs) {
//    _.each(blogs, function(blog) { blog.name = blog.tumblrUsername; });
//    callback(err, err ? [] : _.map(blogs, function(blog) {
//      return { name: blog.tumblrUsername, origin: 'solr' };
//    }));
//  });
//};

var interestingBlogsCache = require('./interestingBlogsCache');

function followBlogRecommendation(user, callback) {
  var logInfo = { tumblrUsername: user.tumblrUsername };
  var funnel = funnelTracker.start('recFollowBlogs', logInfo);
//  logger.info('recFollowBlogs-start', logInfo);
  funnel.step('start');
  async.parallel([
    _.partial(brickflowBlogs, user),

//    function(cb) {
//      InteractionCtr.getBlogsByTags(
//          _.pluck(user.hashtags, 'label'),
//          function(err, res) {
//            cb(err, err ? null : _.map(res, function(name) {
//              return { name: name, origin: 'interactions' };
//            }));
//          });
//    }
    function getInterestingBlogs(cb) {
//      logger.info('recFollowBlogs-getInterestingBlogs', logInfo);
      funnel.step('getInterestingBlogs');
      interestingBlogsCache.getSync(_.pick(user, [
        'tumblrUsername',
        'tumblrAccessToken',
        'tumblrSecret'
      ]), function(err, res) {
        if (err) {
          logger.error('recFollowBlogs-gotInterestingBlogs-error', logInfo);
        } else {
          logger.info('recFollowBlogs-gotInterestingBlogs', logInfo);
        }
        cb(err, res);
      });
    }
//    _.partial(interestingBlogsCache.getSync, _.pick(user,
//        'tumblrUsername', 'tumblrAccessToken', 'tumblrSecret')),
//    _.partial(getInterestingBlogs, user),

//    _.partial(getUsersWithSimilarHashtags, user),
//    _.partial(getSomeUsers, user)
  ], function(err, results) {
    funnel.step('recFollowBlogs-rawResult');
    if (err) {
      results = [];
    }
    var blogs = _(results).
        flatten().
        compact().
        each(function(blog) {
          if (blog.blogName) {
            blog.name = blog.blogName;
            blog.blogName = undefined;
          }
        }).
        filter(function (blog) {
          return !_.contains(user.followedBlogs, blog.name);
        }).
        uniq('name').
        value();
    funnel.step('recFollowBlogs-getBlogInfos');
    async.map(blogs, asyncWithTimeout(function(blog, cb) {
      if (blog.images) {
        return cb(null, blog);
      }
      tumblr.getBlogInfo(blog.name, function(err, blogInfo) {
        if (err) { return cb(err); }
        if (blogInfo.images.length === 0) { return cb(); }
        cb(null, _.assign(blog, blogInfo));
      });
    }, 60000, null), function(err, blogs) {

      blogs = _.compact(blogs);
      funnel.step('recFollowBlogs-gotBlogInfos', {
        blogCount: blogs && blogs.length
      });
      funnel.end(false);
      callback(err ? err : null, {
        status: err ?
        { error: err.message, stack: err.stack } :
        { blogs: blogs.length },
        blogs: blogs
      });
    });
  });
}

module.exports = followBlogRecommendation;
