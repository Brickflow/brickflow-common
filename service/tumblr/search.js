'use strict';
var _ = require('lodash'),
    async = require('async');
var client = require('./client'),
    transformBrick = require('./transformBrick');

module.exports = function(hashtag, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  client.tagged(
      hashtag,
      options,
      function(err, reply) {
        async.map(
            _.filter(reply, function(post) {
              return post.type === 'video' || (
                  post.photos && post.photos.length === 1);
            }),
            function(brick, cb) {
              transformBrick(brick, function(err, brick) {
                cb(null, _.assign(brick, { hashtag: hashtag }));
              });
            },
            function (err, results) {
              results = _(results).compact().uniq('url').value();
              callback(null, results);
            });
      }
  );
};
