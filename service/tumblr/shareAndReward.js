var _ = require('lodash'),
    async = require('async');
var reward = require('../reward'),
    share = require('./share'),
    UserCtr = require('../../controller/userCtr');
module.exports = function shareAndReward(options, cb){
  async.parallel([
    _.partial(share, options),
    _.partial(reward.giveStarForUser, options.user, 0.5),
    _.partial(UserCtr.updateLastPostAt, options.user)
  ], cb);
};
