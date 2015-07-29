

/* jshint camelcase: false */
'use strict';

var _ = require('lodash');
var async = require('async');
var config = require('../config');
var instagram = require('instagram-node-lib');
var request = require('request');
var prefix = 'in';

instagram.set('client_id', config.get('private:INSTAGRAM_CLIENT_ID'));
instagram.set('client_secret', config.get('private:INSTAGRAM_SECRET'));

function transformBrick(hashtag, brick, cb) {
  if (typeof brick === 'function') {
    cb = brick;
    brick = hashtag;
    hashtag = brick.tags[0];
  }
  var transformedBrick = {
    _id: prefix + brick.id,
    media: brick.link,
    provider: 'instagram',
    hashtag: hashtag,
    hashtags: brick.tags,
    url: (brick.videos||brick.images).low_resolution.url,
    creatorName: brick.user.full_name,
    creatorId: brick.user.id,
    creatorProfilePicture: brick.user.profile_picture,
    text: brick.caption ? brick.caption.text : '',
    type: brick.type,
    thumbnail: (brick.images||brick.videos).low_resolution.url,
    createdAt: new Date(),
    postedAt: new Date(parseInt(brick.created_time + '000')),
    likeCount: brick.likes.count,
    coordinates: brick.location
  };
  return cb(null, transformedBrick);

}


function search(hashtag, mainCallback) {
  instagram.tags.recent({
    name: hashtag,
    complete: function(reply) {
      async.map(
          reply,
          _.partial(transformBrick, hashtag),
          function (err, results) {
            mainCallback(null, results);
          });
    },
    error: function(){
      mainCallback(null, []);
    }
  });
}

function popular(callback) {
  instagram.media.popular({
    complete: function(reply) {
      async.map(reply, transformBrick, callback);
    },
    error: function() {
      callback(null, []);
    }
  });
}

function mediaById(id, callback) {
  instagram.media.info({
    media_id: id,
    complete: function(brick) {
      transformBrick(brick, callback);
    }
  });
}

function isMediaUrl(url) {
  return !!url.match(/instagram/);
}

function getIdFromUrl(url, cb) {
  request('http://api.instagram.com/oembed?url=' + url,
          function(error, response, body) {
    cb(null, JSON.parse(body).media_id);
  });
}

module.exports = {
  search: search,
  popular: popular,
  mediaById: mediaById,
  isMediaUrl: isMediaUrl,
  getIdFromUrl: getIdFromUrl
};

