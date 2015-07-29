'use strict';

var scorerFactory = require('../service/scorerFactory');
var _ = require('lodash');
var config = require('../config');

var score = {
  blogs: function(user, blogs, cb) {
    var scorer = scorerFactory('tumblrBlog',
      require('../scoreRules/scoreTumblrBlog'), {
        user: user.tumblrUsername
      });
    scorer(blogs);
    cb(null, score.order(blogs));
  },

  firstLayerBlogs: function(user, blogs, cb) {
    var scorer = scorerFactory('scoreTumblrBlog',
      require('../scoreRules/scoreTumblrBlog'), {
        user: user.tumblrUsername
      });

    // score first layer blogs:
    scorer(blogs);

    _.each(blogs, function(firstLayerBlog) {
      // store their scores in corresponding second layer blogs:
      _.each(firstLayerBlog.interestingBlogs, function(blog) {
        blog.parentBlogName = firstLayerBlog.blogName;
        blog.parentBlogScore = firstLayerBlog.score;
        blog.parentBlogFollowing = firstLayerBlog.following;
      });
    });
    cb(null, score.order(blogs));
  },

  secondLayerBlogs: function(user, blogs, cb) {
    score.blogs(user, blogs, function(err, scoredBlogs) {
      cb(null, _(scoredBlogs).first(
        config.get('TUMBLR_RECOMMENDATION_BLOGS_LIMIT')
      ).values().value());
    });
  },

  posts: function(user, posts, cb) {
    var scorer = scorerFactory('tumblrPost',
      require('../scoreRules/scoreTumblrPost'), {
        user: user.tumblrUsername
      });
    scorer(posts);
    cb(null, score.order(posts));
  },

  hashtags: function(user, blogs, cb) {
    var scorer = scorerFactory('tumblrTags',
      require('../scoreRules/scoreTumblrTags'), {
        user: user.tumblrUsername
      });
    var occurrencesByTags = _(blogs).
        pluck('hashtagOccurencies').
        flatten().
        groupBy('tag').value();

    var tagObjects = _(occurrencesByTags).map(
        function(occurrencesByTags, tag) {
          var tagObj = {
            tag: tag,
            score: null,
            occurrences: occurrencesByTags
          };
          return tagObj;
        }).value();

    scorer(tagObjects);

    cb(null, score.order(tagObjects));

  },

  order: function(collection) {
    return _(collection).sortBy(function(item) {
      if (isNaN(item.score)) {
        item.score = 0;
      }
      return -1 * item.score;
    }).value();
  }

};

module.exports = score;