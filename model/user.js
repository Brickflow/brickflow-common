'use strict';
var mongoose = require('mongoose'),
    findOrCreate = require('mongoose-findorcreate'),
    createdModified = require('mongoose-createdmodified').createdModifiedPlugin,
    Schema = mongoose.Schema,
    Post = require('./post');

var UserSchema = new Schema({
    name: String,
    email: { type: String, index: true },
    unsubscribed: { type: Boolean, 'default': false },
    hash: String,
    tumblrFollowers: Number,
    username: String,
    facebookId: String,
    accessToken: String,
    facebook: { },
    followedBlogs: Array,
    friends: Array,
    hashtags: Array,
    gotInvestment: { type: Boolean, 'default': false },
    interestingBlogs: Array,
    interestingBlogsAt: Date,
    interestingBlogsCachingFirst: { type: Boolean, 'default': false},
    tumblrUsername: String,
    tumblrAccessToken: String,
    tumblrSecret: String,
    premiumPlanSelection: { type: String, 'default': '' },
    starCount: { type: Number, 'default': 0 },
    lastPostAt: Date,
    activityFunnelCount: {type: Number, 'default': 0},
    isStaff: { type: Boolean, 'default': false },
    coordinates: [Number],
    mixpanelOriginalId: String,
    showedModals: Array,
    dailyShares: {type: Number, 'default': 0},
    dailyFollows: {type: Number, 'default': 0},
    dailyShowcasePosted: {type: Boolean, 'default': false},
    journeyFinishedAt: {type: Date, 'default': null},
    lastJourneyReset: {type: Date, 'default': null},
    feedCache: {type: Object, 'default': {}},
    lastSeenAt: {
      type: Date,
      'default': function() {
        return new Date();
      }
    }
  });

UserSchema.method('getNoteCount', function(cb) {
  Post.aggregate([{
    $match: {
      blog: this.tumblrUsername + '.tumblr.com',
      brick: { $not: /^tu/ }
    }
  }, {
    $group: {
      _id: 'blog',
      totalNoteCount: {$sum: '$lastKnownNoteCount - $baseNoteCount'}
    }
  }
  ], function(err, res) {
    cb(err, err ? null : res[0].totalNoteCount);
  });
});

UserSchema.plugin(createdModified, {
  createdName: 'createdAt'
});
UserSchema.plugin(findOrCreate);

UserSchema.index({ 'coordinates' : '2dsphere'});

module.exports = mongoose.model('User', UserSchema);
