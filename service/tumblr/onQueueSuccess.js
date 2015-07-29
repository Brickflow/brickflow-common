'use strict';

var _ = require('lodash'),
    async = require('async');
var Brick = require('../../model/brick'),
    User = require('../../model/user'),
    Post = require('../../model/post'),
    client = require('./client'),
    tumblrLogger = require('../../metrics').createTracker('tumblr');

function compareBrickToPost(brick, post) {
  return (post.source_url && post.source_url === brick.media) ||
      (post.photos && post.photos[0].original_size.url === brick.url);
}

function getAndSaveTumblrPostId(tumblrUsername, blogName, brickId, postType, cb) {
  tumblrUsername = tumblrUsername.replace('.tumblr.com', '');
  blogName.replace('.tumblr.com', '');
  cb = cb || _.noop;

  async.parallel({
    user: function(cb) {
      User.find({tumblrUsername: tumblrUsername}, {}, function(err, res) {
        cb(err, err ? null : res[0]);
      });
    },
    brick: function(cb) {
      Brick.find({_id: brickId}, {}, function(err, res) {
        cb(err, err ? null : res[0]);
      });
    }
  }, function (err, dbResponse) {
    if (err) {
      return cb(err);
    }

    client.posts(tumblrUsername, {
      limit: 5,
      notes_info: true
    }, function (err, tumblrResponse) {
      if (err) {
        return cb(err);
      }

      var post = _(tumblrResponse.posts).find(function(post) {
        return compareBrickToPost(dbResponse.brick, post);
      });

      if (!post) {
        return cb('Post not found');
      }

      Post.update({
        user: dbResponse.user._id,
        brick: dbResponse.brick._id,
        blog: blogName
      }, {
        tumblrId: post.id,
        baseNoteCount: post.note_count,
        lastKnownNoteCount: post.note_count,
        lastNoteCountCheckAt: new Date()
      }, cb);
    });
  });
}


module.exports = function(msg) {
  tumblrLogger.info('tumblr-queue-success', msg);
  if (msg.command === 'follow') {
    User.findOne({
      tumblrUsername: msg.tumblrUsername
    }, function(err, user) {
      if (!err) {
        UserCtr.setBlogFollowed(user, msg.followBlogName, function() {
          require('../../feed/blogCache').update(user);
        });
      }
    });
  } else {
    setTimeout(function() {
      getAndSaveTumblrPostId(msg.tumblrUsername,
          msg.tumblrUsername,
          msg.brickId);
    }, 5000);
  }
};