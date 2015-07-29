'use strict';
var _ = require('lodash'),
    async = require('async');
var getBlogInfo = require('./getBlogInfo');

module.exports = function(bricks, callback) {
  async.mapSeries(
      _(bricks).pluck('creatorName').uniq().value(),
      getBlogInfo,
      function(err, blogInfos) {
        var nsfwBlogNames = _(blogInfos).filter('nsfw').pluck('name').value();
        callback(err, err ? null : _.reject(bricks, function(brick) {
          return _.contains(nsfwBlogNames, brick.creatorName);
        }));
      }
  );
};