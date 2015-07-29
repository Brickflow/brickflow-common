'use strict';

var _ = require('lodash');
var async = require('async');
var config = require('../config');
var util = require('util');
var Vineapple = require('vineapple');
var logger = require('../metrics').
             createTracker('vine', null, {mixpanel: true});

var prefix = 'vi';

// Instantiate a Vine API client
var vine = new Vineapple(),
    vineEmail = config.get('private:VINE_EMAIL'),
    vinePassword = config.get('private:VINE_PASSWORD'),
    vineClient;

function vineLogin() {
  vine.login(vineEmail, vinePassword, function (error, client) {
    if (error){
      console.log('vineLogin failed: ', util.inspect(error));
    } else {
      console.log('vineLogin successful.');
    }
    vineClient = client;
  });
}
vineLogin();

function getVine(cb) {
  if (vineClient) {
    cb(null, vineClient);
  } else {
    vine.login(vineEmail, vinePassword, function(err, client) {
      if (err) {
        logger.error('vine-login', {
          error: err,
          stack: err.stack,
          status: 'error'
        });
      } else {
        vineClient = client;
        logger.info('vine-login', {
          status: 'success'
        });
      }
      cb(err, err ? null : client);
    });
  }
}

var transformBrick = function(hashtag, brick, doneCallback) {
  if (typeof brick === 'function') {
    doneCallback = brick;
    brick = hashtag;
    hashtag = null;
  }
  var transformedBrick = {
    _id: prefix + brick.postId,
    media: brick.permalinkUrl,
    provider: 'vine',
    hashtag: hashtag,
    hashtags: brick.tags,
    url: brick.videoUrl,
    text: brick.description,
    creatorName: brick.username,
    creatorId: brick.userId,
    creatorProfilePicture: brick.avatarUrl,
    type: 'video',
    thumbnail: brick.thumbnailUrl,
    createdAt: new Date(),
    postedAt: brick.created,
    likeCount: brick.likes.count,
    coordinates: null
  };
  return doneCallback(null, transformedBrick);
};

function mediaById(id, mainCallback){
  getVine(function(err, vineClient) {
    vineClient.vineById(id, function(error, reply){
      if (error){
        return mainCallback(error, null);
      }

      if(reply.records[0]) {
        transformBrick(reply.records[0], mainCallback);
      } else {
        return mainCallback(error, null);
      }
    });
  });
}

function search(hashtag, mainCallback) {
  getVine(function(err, vineClient) {
    vineClient.tag(hashtag, function (error, reply) {
      // Handle failure
      if (error) {
        console.log(util.inspect(error));
        mainCallback(error);
      }

      async.map(
          reply.records,
          _.partial(transformBrick, hashtag),
          function (err, results) {
            mainCallback(null, results);
          }
      );
    });
  });
}

function popular(callback) {
  getVine(function(err, vineClient) {
    vineClient.popular({}, function(err, reply) {
      if (err) {
        return callback(err);
      }
      async.map(reply.records, transformBrick, function(err, results) {
        callback(null, results);
      });
    });
  });
}

module.exports = {
  search: search,
  popular: popular,
  mediaById: mediaById
};
