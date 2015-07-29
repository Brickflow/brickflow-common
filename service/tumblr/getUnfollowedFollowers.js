var _ = require('lodash'),
    async = require('async');
var getAPI = require('./getAPI');

module.exports = function recurse(user, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = { /* offset: 0, limit: 20 */ };
  }
  if (options.limit > 20) {
    async.map(_.times(Math.ceil(options.limit / 20)), function(page, cb) {
      recurse(user, {offset: (options.offset || 0) + page * 20}, cb);
    }, function(err, responses) {
      cb(err, err ? null : _(responses).flatten().compact().uniq().value());
    });
  } else {
    getAPI(user).followers(user.tumblrUsername, options, function(err, res) {
        cb(err, err ? null :
            _(res.users).reject('following').pluck('name').value());
      });
  }
};
