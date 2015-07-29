'use strict';
var client = require('./client'),
    getAPI = require('./getAPI');

var self = {
  search: require('./search'),
  mediaById: require('./mediaById'),
  transformBrick: require('./transformBrick'),

  invite: require('./invite'),

  share: require('./share'),
  shareAndReward: require('./shareAndReward'),
  followBlog: require('./followBlog'),

  filterNsfw: require('./filterNsfw'),
  getPostsForBlogs: require('./getPostsForBlogs'),
  getFirstLayerBlogs: require('./recFirstLayer'),
  fetchSecondLayerBlogs: require('./recSecondLayer'),

  getBlogPosts: require('./getBlogPosts'),
  getBlogInfo: require('./getBlogInfo'),

  getUnfollowedFollowers: require('./getUnfollowedFollowers'),

  onQueueSuccess: require('./onQueueSuccess')
};

self.getFollowingCount = function(user, callback) {
  getAPI(user).following(function(err, resp) {
    callback(err, err ? null : resp.total_blogs);
  });
};

self.getFollowerCount = function(user, callback) {
  getAPI(user).followers(user.tumblrUsername, function(err, res) {
    callback(err, err ? null : res.total_users);
  });
};

self.getPostCount = function(user, callback) {
  client.blogInfo(user.tumblrUsername, function(err, res) {
    callback(err, err ? null : res.blog.posts);
  });
};

module.exports = self;
