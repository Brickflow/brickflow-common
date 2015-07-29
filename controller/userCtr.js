'use strict';

var User = require('../model/user'),
    _ = require('lodash'),
    reward = require('../service/reward'),
    config = require('../config'),
    lastSeen = require('../service/lastSeen'),
    EventEmitter = require('events').EventEmitter,
    logger = require('../metrics').createTracker('retention'),
    UserCtr = {};

var emitter = new EventEmitter();

UserCtr.resetCacheFlags = function() {
  User.update({
    interestingBlogsAt: { '$exists': false },
    interestingBlogsCachingFirst: true
  }, {
    interestingBlogsCachingFirst: false
  }, {
    multi: true
  });
};

UserCtr.updateLastPostAt = function(user, callback) {
  var date = new Date();
  date.setHours(date.getHours() -
                config.get('ACTIVE_USER_SHARE_HOURS'));
  if (! user.lastPostAt || user.lastPostAt <= date) {
    user.activityFunnelCount++;
  }

  var now = new Date();
  user.lastPostAt = now;

  User.update({_id: user._id}, {
    activityFunnelCount:  user.activityFunnelCount,
    lastPostAt: now
  }, callback);
};

UserCtr.setStarCount = function(user, num, callback){
  user.starCount = num;
	User.findOne({hash: user.hash},
    function(err, doc){
      doc.starCount = num;
      doc.save(callback);
    }
  );
};

UserCtr.getSomeUsers = function(limit, cb) {
  if (typeof limit === 'function') {
    cb = limit;
    limit = 50;
  }
  User.aggregate(
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $project: { _id: true, tumblrUsername: true, hashtags: true } },
      cb);
};

UserCtr.getUnfollowedUsersWithSimilarHashtags = function(user, tags, callback) {
  User.aggregate({
    $match: {
      tumblrUsername: {
        $ne: user.tumblrUsername, // not this user
        $nin: user.followedBlogs  // not followed by the users
      },
      hashtags: { $elemMatch: { label: { $in: tags } } }
    }
  }, {
    $project: {
      _id: true,
      tumblrUsername: true,
      hashtags: true
    }
  }, {
    $sort: { createdAt: -1 }
  }, {
    $limit: 100
  }, callback);
};

function setinterestingBlogsCachingFirstFlag(user, value, cb) {
  cb = cb || function() {};
  User.findOne({_id: user._id}, function(err, doc) {
    if (err) {
      return cb(err);
    }

    user.interestingBlogsCachingFirst = value;
    doc.interestingBlogsCachingFirst = value;
    doc.save();

    cb(null, doc);
  });
}

UserCtr.onDeserializeUser = function(user, done) {
  reward.lazyCheck(user);
  this.updateLastSeen(user);
  this.updateUserJourney(user, done);
};

UserCtr.updateUserJourney = function(user, done){
  if(user && user.lastPostAt){
    var eightHours = 8 * 60 * 60 * 1000;

    var referenceTime = user.journeyFinishedAt ?
      user.journeyFinishedAt.getTime() + eightHours :
      user.lastPostAt.getTime() + eightHours;

    var canReset = true;

    if(user.lastJourneyReset){
      canReset = (user.lastJourneyReset.getTime() + eightHours) < Date.now();
    }
    if((referenceTime < Date.now()) && canReset){
      return UserCtr.resetUserJourney(user, done);
    }
    return done(null, user);
  } else {
    return done(null, user);
  }
};

UserCtr.getEventEmitter = function() {
  return emitter;
};

UserCtr.afterRegistration = function(user) {
  require('../feed/yourCache').update(user);
  //require('../service/solr').createOrUpdateBlog(user);
};


UserCtr.updateLastSeen = function(user){
  var prevLastSeen = lastSeen.refresh(
      user,
      config.get('LAST_SEEN_TRESHOLD_HOURS')
  );
  if (prevLastSeen !== null) {
    var dayBetween = Math.floor((new Date() - prevLastSeen ) /
                                (1000 * 60 * 60 * 24));
    logger.info(dayBetween + '-day-retention', _.pick(user, '_id'));
  }
};

//UserCtr.storeInterestingBlogsAsync = function(user, blogs, callback) {
//  User.findOneAndUpdate({_id: user._id}, {
//    interestingBlogs: blogs,
//    interestingBlogsAt: new Date(),
//    interestingBlogsCachingFirst: false
//  }, function(){});
//  return callback(null, blogs);
//};

UserCtr.collectHashtags = function(user, callback) {
  var interestingHashtagsCache = require('../feed/interestingHashtagsCache');
  interestingHashtagsCache.getSync(user,
      function(err, response) {
        if (! err) {
          var hashtags = _(response).sortBy(function(tag) {
            return tag.score * -1;
          }).map(function(tag) {
            return {
              label: tag.tag,
              score: tag.score,
              origin: 'rec'
            };
          }).value();

          User.update({ hash: user.hash }, { hashtags: hashtags }, callback);

        }
      });
};

UserCtr.storeSearchedHashtag = function(user, hashtag, callback) {
  User.findOne({ _id: user._id }, function(err, user) {
    var match = _.where(user.hashtags, {label: hashtag});
    var scoreIncrement = config.get('HASHTAG_SEARCH_SCORE_INCREMENT');

    var tags = user.hashtags;
    if (match.length > 0) {
      _.where(tags, {label: hashtag})[0].score += scoreIncrement;

    } else {
      tags.push({
        label: hashtag,
        score: scoreIncrement,
        origin: 'search'
      });
    }

    User.findOneAndUpdate({ _id: user._id}, {hashtags: tags}, callback);
  });
};

UserCtr.setHashtags = function(user, hashtags, callback){
  user.hashtags = hashtags;
	User.findOne({hash: user.hash},
    function(err, doc){
      doc.hashtags = hashtags;
      doc.save(callback);
    }
  );
};

UserCtr.setPremiumPlanSelection = function(user, feature, cb) {
  user.premiumPlanSelection = feature;
  User.findOne({hash: user.hash}, function(err, doc) {
    doc.premiumPlanSelection = feature;
    doc.save(cb);
  });
};

UserCtr.getInactiveUsersRegisteredYesterday = function(callback) {
  var yesterdayMidnight = new Date();
  yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
  yesterdayMidnight.setHours(0);
  yesterdayMidnight.setMinutes(0);
  yesterdayMidnight.setSeconds(0);
  yesterdayMidnight.setMilliseconds(0);

  var todayMidnight = new Date();
  todayMidnight.setHours(0);
  todayMidnight.setMinutes(0);
  todayMidnight.setSeconds(0);
  todayMidnight.setMilliseconds(0);

  User.find({
    createdAt: {
      $gte: yesterdayMidnight,
      $lte: todayMidnight
    },
    lastPostAt: null
  }, callback);
};

UserCtr.setBlogFollowed = function(user, blogName, cb) {
  if (user.followedBlogs === undefined){
    user.followedBlogs = [];
  }
  user.followedBlogs.push(blogName);
  User.findOne({hash: user.hash},
    function(err, doc){
      if (doc.followedBlogs === undefined){
        doc.followedBlogs = [];
      }
      doc.followedBlogs.push(blogName);
      doc.save(cb || function(){});
    }
  );
};

UserCtr.setFeedCache = function(user, type, feed, cb) {
  if (typeof cb !== 'function') {
    cb = _.noop;
  }
  var payload = {};
  payload['feedCache.' + type] = feed;
  User.update({_id: user._id}, payload, cb);
};

UserCtr.resetUserJourney = function(user, done) {
  var newData = {
    dailyShares: 0,
    dailyFollows: 0,
    dailyShowcasePosted: false,
    lastJourneyReset: new Date()
  };

  User.update({_id: user._id}, newData, _.noop);
  _(user).assign(newData);
  done(null, user);
};

UserCtr.incrementDailyShares = function(user) {
  User.update({_id: user._id}, {$inc: {dailyShares: 1}}, _.noop);
};

UserCtr.incrementDailyFollows = function(user) {
  User.update({_id: user._id}, {$inc: {dailyFollows: 1}}, _.noop);
};

UserCtr.setDailyShowcasePosted = function(user, value) {
  if (arguments.length === 1) {
    value = true;
  }
  User.update({_id: user._id}, {$set: {dailyShowcasePosted: value}}, _.noop);
};

UserCtr.getFeed = function(user, key, cb) {
  var select = {};
  select['feedCache.' + key] = true;
  User.findOne({tumblrUsername: user.tumblrUsername}, select, function(err, res) {
    cb(err, res && res.feedCache ? res.feedCache[key] : null);
  });
};

UserCtr.setFeed = function(user, key, value, cb) {
  var update = {};
  update['feedCache.' + key] = value;
  User.update({tumblrUsername: user.tumblrUsername}, update, function(err) {
    cb(err, err ? null : value);
  });
};

UserCtr.processAllUsers = function(user, options, task, cb) {
  if (typeof options === 'function') {
    cb = task;
    task = options;
    options = {};
  }
  User.find({}, { createdAt: true, tumblrUsername: true }, function(err, resp) {
    if (err) {
      console.log('processAllUsers error', {
        err: err,
        stack: err.stack
      });
    } else {
      task(resp, cb);
    }
  });
};


UserCtr.getUserByRequest = function(req, callback) {
  if (req.params.userId === req.user._id.toString() ||
      req.params.blog === req.user.tumblrUsername) {
    callback(null, req.user);
  } else if (req.user.isStaff === true) {
    User.findOne(req.params.userId ?
      {_id: req.params.userId} :
      {tumblrUsername: req.params.blog},
        callback);
  }
};

UserCtr.unsubscribe = function(tumblrUsername, cb) {
  User.update({ tumblrUsername: tumblrUsername }, { unsubscribed: true }, cb);
};

module.exports = UserCtr;
