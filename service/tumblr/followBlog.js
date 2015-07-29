'use strict';
var rabbitmq = require('../rabbitmq');
module.exports = function(user, blogName, cb) {
  rabbitmq.publish('tumblr-queue', {
    credentials: {
      token: user.tumblrAccessToken,
      token_secret: user.tumblrSecret
    },
    logInfo: {
      followBlogName: blogName,
      tumblrUsername: user.tumblrUsername
    },
    command: 'follow',
    args: [blogName + '.tumblr.com']
  });
  cb(null, 'followBlog-queued');
};
