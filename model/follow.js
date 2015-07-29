'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FollowSchema = new Schema({
  followerUser: String,
  followedBlog: String,
  createdAt: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('Follow', FollowSchema);
