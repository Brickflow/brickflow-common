/* jshint camelcase: false */
'use strict';

// var Brick = require('../model/brick');
var User = require('../model/user');
var tagSearch = require('../feed/tagSearch');
var tumblr = require('./tumblr');
var logger = require('../metrics').createTracker('email');
var _ = require('lodash');
var config = require('../config');
var request = require('request');

var self = {};

self.getRootURL = function() {
  var port = config.get('PORT');
  var rootURL = 'http://' + config.get('HOST');
  if (port && port !== 80) {
    rootURL += ':' + port;
  }
  return rootURL;
};

self.getUser = function(userID, cb) {
  User.findOne({ _id: userID }, cb);
};

self.logAndRedirect = function(req, res, logAs, url, hashtag) {
  logger.info(logAs, {
    user: req.query.id,
    type: req.query.type,
    search: req.query.search,
    hashtag: hashtag,
    url: url
  });
  if (req.query.type === 'image') {
    request({url: url, encoding: null}, function(err, response, body) {
      res.writeHead(200, {'Content-Type': 'image/gif' });
      res.end(new Buffer(body, 'binary'), 'binary');
    });
  } else {
    res.redirect(url);
  }
};

self.template = function(req, res) {
  var searchMethod, hashtag, clickThroughPath;

  // user id is required
  if (! req.query.id) {
    res.send(404, 'No user ID were given');
    return;
  }

  switch(req.query.search) {
    case 'your':
      searchMethod = tumblr.yourSearch;
      clickThroughPath = '/your';
      break;
    case 'hashtag':
      searchMethod = function(user, cb) {
        hashtag = _.max(user.hashtags, 'value').hashtag;
        tagSearch(hashtag, function(err, resp) {
          cb(err, err ? null : resp.bricks);
        });
        clickThroughPath = '/b/' + hashtag;
      };
      break;
    default:
      res.send(404, 'Invalid or no search method were given');
      return;
  }

  var n = req.query.n || 0;
  switch (req.query.type) {
    case 'image':
      self.getUser(req.query.id, function(err, user) {
        searchMethod(user, function(err, bricks) {
          var url = bricks[n].url;
          self.logAndRedirect(req, res,
            'getEmailImageURL', url);
        });
      });
      break;
    case 'link':
      self.getUser(req.query.id, function(err, user) {
        searchMethod(user, function(err, bricks) {
          var url = self.getRootURL() + clickThroughPath +
            '?id=' + bricks[n]._id;
          self.logAndRedirect(req, res,
                              'getEmailClickThroughURL', url);
        });
      });
      break;
    default:
      res.send(404, 'Invalid endpoint type');
      break;
  }
};

module.exports = self;
