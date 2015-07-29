/* jshint camelcase: false */
'use strict';
var _ = require('lodash');
var config = require('../config');
var tumblr = require('./tumblr');
var async = require('async');

var logger = require('../metrics').createTracker('recommend');

var User = require('../model/user');
var UserCtr = require('../controller/userCtr');

var score = require('./recommendScorers');

var recommend = {};

function mapSecondLayerBlogs(firstLayerBlogs, cb) {
  cb(null,
      _(firstLayerBlogs).
          pluck('interestingBlogs').
          map(function(secondLayerBlogsObject) {
            return _.values(secondLayerBlogsObject);
          }).
          flatten().
          values().
          groupBy('blogName').
          map(function(blogs) {
            return _(blogs).reduce(
                function(result, blogInfo) {
                  result.value += blogInfo.value;
                  result.parentBlogScore = blogInfo.parentBlogScore;
                  return result;
                });
          }).
          value()
  );
}

function addUserToBlogs(user, blogs, cb) {
  blogs.push({
    blogName: user.tumblrUsername,
    following: true,
    reblogs: 0
  });
  cb(null, blogs);
}

function fetchPostsIntoBlogs(blogs, callback) {
  async.each(blogs, function(blog, cb) {
    tumblr.getBlogPosts(blog.blogName, {
      limit: config.get('TUMBLR_RECOMMENDATION_POSTS_LIMIT'),
      notes_info: true
    }, function(err, posts) {
      blog.posts = posts;
      cb(err);
    });
  }, function(err) {
    callback(err, err ? [] : blogs);
  });
}

function collectHashtagOccurenciesIntoBlogs(blogs, callback) {
  async.each(blogs, function(blog, cb) {
    var occurrences = [];
    _.each(blog.posts, function(post) {
      _.each(post.tags, function(tag) {
        occurrences.push({
          tag: tag,
          blogName: blog.blogName,
          blogScore: blog.score,
          post: {
            id: post.id,
            noteCount: post.note_count,
            reblogKey: post.reblog_key
          }
        });
      });
    });
    blog.hashtagOccurencies = occurrences;
    cb(null);
  }, function(err) {
    callback(err, err ? [] : blogs);
  });
}

var firstLayerBlogsCache = require('../feed/firstLayerBlogsCache');
// yourInterestingBlogs
recommend.blogs = function(user, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  var log = function(key) {
    return function(payload, cb) {
      logger.info(key, {tumblrUsername: user.tumblrUsername});
      cb(null, payload)
    };
  };
  log('recSecondLayer-start');
  async.waterfall([
    _.partial(firstLayerBlogsCache.getSync, user),
    log('recSecondLayer-gotFirstLayer'),
    _.partial(tumblr.fetchSecondLayerBlogs, _.clone(options)),
    log('recSecondLayer-tumblrFetchedSecondLayer'),
    _.partial(score.firstLayerBlogs, user),
    mapSecondLayerBlogs
  ], function(err, res) {
    console.log('KIBASZOTT IZGIBLOG SZOPOKA', arguments);
    callback(err, res);
  });

};

// getInterestingHashtags
recommend.hashtags = function(user, callback) {
  var log = function(key) {
    return function(payload, cb) {
      logger.info(key, {tumblrUsername: user.tumblrUsername});
      cb(null, payload);
    };
  };
  log('recInterestingHashtags-start');
  async.waterfall([
    _.partial(tumblr.getFirstLayerBlogs, user, {}),
    log('recInterestingHashtags-gotFirstLayer'),
    _.partial(addUserToBlogs, user),
    log('recInterestingHashtags-fetchPostsForThumbnails'),
    fetchPostsIntoBlogs,
    log('recInterestingHashtags-fetchedPostsForThumbnails'),
    _.partial(score.blogs, user),
    log('recInterestingHashtags-scoredBlogs'),
    collectHashtagOccurenciesIntoBlogs,
    log('recInterestingHashtags-collectedHashtags'),
    _.partial(score.hashtags, user),
    log('recInterestingHashtags-done')
  ], function(err, res) {
    console.log('KIBASZOTT IZGIHESSTEGG SZOPOKA', arguments);
    callback(err, res);
  });
};

module.exports = recommend;