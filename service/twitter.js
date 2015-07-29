/* jshint camelcase: false */
'use strict';

var async = require('async');
var config = require('../config');
var Twit = require('twit');
var _ = require('lodash');
var prefix = 'tw';

/* jshint -W101 */
var TWITTER_URL_REGEX = /https?:\/\/(www\.)?twitter\.com\/(#!\/)?(\w+)\/status(es)?\/(\d+)?(\/photo\/1)?$/;
/* jshint +W101 */

var T = new Twit({
  'consumer_key': config.get('private:TWITTER_KEY'),
  'consumer_secret': config.get('private:TWITTER_SECRET'),
  'access_token': config.get('private:TWITTER_ACCESS_TOKEN'),
  'access_token_secret': config.get('private:TWITTER_ACCESS_TOKEN_SECRET')
});

function search(hashtag, mainCallback){
  T.get('search/tweets',
    {
      q: hashtag + ' filter:images',
      count: 40
    },
    function(err, reply) {
      if (err) {
        return mainCallback(err);
      }
      
      var transform = function(brick, donecallback){
        if (!brick.entities.media) {
          return donecallback(null, undefined);
        }
        
        var hashtags = [];
        _(brick.entities.hashtags).forEach(function(hashtag){
          hashtags.push(hashtag.text);
        });

        var transformedbrick = {
          _id: prefix + brick.id_str,
          url: brick.entities.media['0'].media_url,
          provider: 'twitter',
          nsfw: brick.possibly_sensitive,
          hashtag: hashtag,
          hashtags: hashtags,
          media: 'http://twitter.com/statuses/' + brick.id_str,
          thumbnail: brick.entities.media['0'].media_url,
          creatorName: brick.user.name,
          creatorId: brick.user.id,
          creatorProfilePicture: brick.user.profile_image_url,
          type: 'image',
          text: brick.text,
          coordinates: brick.coordinates,
          likeCount: brick.retweet_count,
          createdAt: new Date(),
          postedAt: brick.created_at
        };
        return donecallback(null, transformedbrick);
      };


      async.map(reply.statuses, transform, function (err, results) {
        results = _(results).compact().uniq('url').value();
        mainCallback(null, results);
      });
    });
}

function trendingTags(callback) {
  T.get('trends/place', {id: 23424977}, function(err, reply) {
    callback(err, err ? null :
        _(reply[0].trends).
            values().
            pluck('query').
            map(decodeURIComponent).
            value());
  });
}

function trendingTweets(callback) {
  trendingTags(function(err, searchTerms) {
    if (err || !searchTerms) {
      return callback(err);
    }
    async.map(searchTerms, search, function(err, res) {
      callback(err, err ? null : _(res).flatten().reject('nsfw').value());
    });
  });
}

function mediaById(tweetId, mainCallback) {
  T.get(
    'statuses/show/:id',
    {
      id: tweetId
    },
    function(err, reply) {
      if (err) {
        mainCallback(err);
      }
      
      function transform(brick, donecallback) {
        if (!brick || !brick.entities.media) {
          return donecallback(null, undefined);
        }
        var hashtags = [];
        _(brick.entities.hashtags).forEach(function(hashtag){
          hashtags.push(hashtag.text);
        });

        var transformedbrick = {
          _id: prefix + brick.id_str,
          url: brick.entities.media['0'].media_url,
          provider: 'twitter',
          hashtags: hashtags,
          media: 'http://twitter.com/statuses/' + brick.id_str,
          thumbnail: brick.entities.media['0'].media_url,
          creatorName: brick.user.name,
          creatorId: brick.user.id,
          creatorProfilePicture: brick.user.profile_image_url,
          type: 'image',
          text: brick.text,
          coordinates: brick.coordinates,
          likeCount: brick.retweet_count,
          createdAt: brick.created_at
        };
        return donecallback(null, transformedbrick);
      }

      transform(reply, mainCallback);
    }
  );
}

function isTweetUrl(url) {
  return !!url.match(TWITTER_URL_REGEX);
}

function getIdFromUrl(url) {
  return url.match(TWITTER_URL_REGEX)[5];
}

module.exports = {
  search: search,
  trending: trendingTweets,
  trendingTags: trendingTags,
  mediaById: mediaById,
  isTweetUrl: isTweetUrl,
  getIdFromUrl: getIdFromUrl
};

