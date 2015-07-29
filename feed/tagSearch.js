'use strict';
var _ = require('lodash');
var async = require('async');
var asyncWithTimeout = require('async-timeout');

var config = require('../config');

var SearchCtr = require('../controller/searchCtr');
var transformFeed = require('./lib/transformFeed');

var twitter = require('../service/twitter');
var instagram = require('../service/instagram');
var tumblr = require('../service/tumblr');
var giphy = require('../service/giphy')(config.get('private:GIPHY_APP_KEY'));
var vine = require('../service/vine');

function searchRegularProviders(tag, options, callback) {
  var timeout =
      config.get('EXTERNAL_PROVIDER_SEARCH_TIMEOUT') || options.timeout;
  var wrap = function(fn) {
    return asyncWithTimeout(_.partial(fn, encodeURIComponent(tag)), timeout, []);
  };
  var threads = {
    vine: wrap(vine.search),
    tumblr: wrap(tumblr.search),
    instagram: wrap(instagram.search),
    twitter: wrap(twitter.search)
  };

  _(threads).keys().each(function(key) {
    if (options[key] === false) {
      delete threads[key];
    }
  });

  async.parallel(threads, function(err, bricksByProvider) {
    var scoredByProvider = transformFeed.scoreByProvider(bricksByProvider, {
      user: options.user ? options.user.tumblrUsername : null
    });
    callback(null, scoredByProvider);
  });
}

module.exports = function(tag, options, callback) {
  var timeout =
      config.get('EXTERNAL_PROVIDER_SEARCH_TIMEOUT') || options.timeout;
  if (_.contains(config.get('BANNED_HASHTAGS'), tag)) {
    return callback(null, {
      bricks: [],
      status: {abusive: true }
    });
  }

  if (typeof callback !== 'function') {
    callback = options;
    options = {};
  }

  async.parallel({
    scored: _.partial(searchRegularProviders, tag, options),
    giphy: asyncWithTimeout(function(cb) {
      if (Boolean(options.giphy) === false) {
        cb(null, []);
      } else {
        giphy.search(tag, cb);
      }
    }, timeout, [])
  }, function(err, resp) {
    var byProviders = transformFeed.limitByProvider(
        _.assign(resp.scored, { giphy: resp.giphy }));
    var nonGiphy =
        _(byProviders).
            omit('giphy').
            values().
            flatten().
            sortBy(transformFeed.brickScoreDESC).
            value();

    callback(err, err ? null : {
      bricks: SearchCtr.interleaveBricks(nonGiphy, byProviders.giphy || []),
      status: {
        regular: nonGiphy.length,
        giphy: options.giphy && byProviders.giphy && byProviders.giphy.length
      }
    });
  });
};
