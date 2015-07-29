/* jshint camelcase: false */
'use strict';

var helper = require('./helper');

module.exports = {

  blogScore: {
    weight: 50,
    saturation: helper.saturation.rangeOfRuleset(require('./scoreTumblrBlog')),
    method: function(post) {
      return post.blogScore;
    }
  },

  noteCount: {
    weight: 10,
    saturation: helper.saturation.gteZeroWithTreshold(300),
    method: function(post) {
      return post.note_count;
    }
  },

  aging: {
    weight: 1000,
    saturation: helper.saturation.lteZeroWithTreshold(10),
    method: function(post) {
      var hoursPassed = Math.round(
              (new Date() - new Date(post.date)) / 1000 / 3600
      );
      return -1 * hoursPassed;
    }
  }
};
