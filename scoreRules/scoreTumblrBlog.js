/* jshint camelcase: false */
'use strict';

var helper = require('./helper');

var scoreTumblrBlog = {

  parentBlogScore: {
    weight: 1000,
    saturation: null, // set later in this file
    method: function(blog) {
      return blog.parentBlogScore || 0;
    }
  },

  parentBlogFollowing: {
    weight: 100,
    saturation: helper.saturation.range(0,1),
    method: function(blog) {
      return blog.parentBlogFollowing ? 1 : 0;
    }
  },

  reblogs: {
    weight: 1000,
    saturation: helper.saturation.gteZeroWithTreshold(100),
    method: function(blog) {
      return blog.reblogs || 0;
    }
  }
};

scoreTumblrBlog.parentBlogScore.saturation =
    helper.saturation.rangeOfRuleset(scoreTumblrBlog);

module.exports = scoreTumblrBlog;

