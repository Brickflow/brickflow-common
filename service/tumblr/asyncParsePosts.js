'use strict';
var _ = require('lodash');
var client = require('./client');

module.exports = function asyncParsePosts(tumblrUsername, options, task, cb) {
  if (typeof options === 'function') { /* options are optional */
    cb = task; task = options; options = {}; }
  if (typeof task !== 'function') { /* task is required */
    return cb(new Error('asyncParsePosts: No task to be performed.')); }
  _.defaults(options, { limit: Infinity, offset: 0 });

  client.posts(tumblrUsername, _.omit(options, 'limit'), function(err, res) {
    if (err) {
      return cb(new Error('asyncParsePosts: Failed. Offset:' + options.offset));
    }
    task(res.posts, function doneCallback() {
      return (options.offset += 20) < _.min([res.total_posts, options.limit]) ?
          asyncParsePosts(tumblrUsername, options, task, cb) :
          (cb || _.noop)(null, res.total_posts);
      });
    });
};