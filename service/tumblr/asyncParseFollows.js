'use strict';
var _ = require('lodash');
var getAPI = require('./getAPI');

module.exports = function asyncParseFollows(user, options, task, cb) {
  if (typeof options === 'function') { /* options are optional */
    cb = task; task = options; options = {}; }
  if (typeof task !== 'function') { /* task is required */
    return cb(new Error('asyncParseFollows: No task to be performed.')); }
  _.defaults(options, { limit: Infinity, offset: 0 });
  options.client = options.client || getAPI(user);

  options.client.following(
      _.omit(options, 'limit', 'client'), function(err, res) {
    if (err) {
      return cb(new Error('asyncParseFollows: Failed. Offset:' + options.offset));
    }
    task(res.blogs, function doneCallback() {
      return (options.offset += 20) < _.min([res.total_blogs, options.limit]) ?
          asyncParseFollows(user, options, task, cb) :
          (cb || _.noop)(null, res.total_blogs);
      });
    });
};