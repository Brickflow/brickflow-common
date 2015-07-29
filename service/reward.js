'use strict';
var User = require('../model/user'),
    config = require('../config');
var MAX_STAR_COUNT = config.get('REWARD_MAX_STAR_COUNT');
var reward = {};

reward.getStarCountByUser = function(user){
  return user.starCount;
};

// num optional
reward.giveStarForUser = function(user, num, cb){
  var getInvestment = false;
  if(!num){
    num = 1;
  }
  if(user.starCount + num > MAX_STAR_COUNT){
    num = MAX_STAR_COUNT - user.starCount;
  }

  if(user.starCount + num >= MAX_STAR_COUNT){
    getInvestment = true;
  }

  User.findOne({hash: user.hash},
    function (err, doc){
      doc.starCount += num;
      doc.gotInvestment = doc.gotInvestment || getInvestment;
      doc.save(cb);
    }
  );
};

reward.lazyCheck = function(user){
  if(user.lastPostAt){
    var todayMidnight =
        new Date().setHours(0,0,0,0);
    var lastPostMidnight =
        new Date(user.lastPostAt.getTime()).setHours(0,0,0,0);
    if(todayMidnight !== lastPostMidnight){
      User.findOne({hash: user.hash},
        function(err, doc){
          doc.starCount = 0;
          doc.save();
        }
      );
    }
  }
};

module.exports = reward;
