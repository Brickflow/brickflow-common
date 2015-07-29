'use strict';
var _ = require('lodash');
var client = require('./client');

module.exports = function(blogName, cb) {
  var followBlog = { name: blogName };

  client.posts(blogName, {type: 'photo'}, function(err, res) {
    if (err) {
      return cb(err);
    }
    followBlog.description = res && res.blog && res.blog.description;
    var posts = _.sortBy(res.posts, function(item) {
      return -item.note_count;
    });
    posts = posts.splice(0, 9);
    followBlog.images = [];
    followBlog.nsfw = !!res.blog.is_nsfw;
    posts.forEach(function(post) {
      var url = post.photos['0'].alt_sizes['2'] === undefined ?
          post.photos['0'].alt_sizes['0'].url :
          post.photos['0'].alt_sizes['2'].url;
      followBlog.images.push(url);
    });

    return cb(null, followBlog);
  });
};