'use strict';
/* jshint unused: false */
var Brick = require('../model/brick'),
    BrickCtr = {};
var config = require('../config');
var _ = require('lodash');
var logger = require('../metrics').createTracker('brickCtr');
var vine = require('../service/vine');

BrickCtr.guessProvider = function(id) {
  var twitter = require('../service/twitter'),
      instagram = require('../service/instagram'),
      tumblr = require('../service/tumblr'),
      giphy = require('../service/giphy')(config.get('private:GIPHY_APP_KEY')),
      prefix = id.substr(0, 2);

  if (id.length === 18 || prefix === 'tw'){
    return twitter;
  }
  if (id.length === 11 || prefix === 'tu'){
    return tumblr;
  }
  if (id.length === 19 || prefix === 'vi'){
    return vine;
  }
  if (prefix === 'gi') {
    return giphy;
  }
  if (id.indexOf('_') >= 0 || prefix === 'in') {
    return instagram;
  }
};

BrickCtr.setHashtagForId = function(id, tag, cb) {
  Brick.findByIdAndUpdate(id, {
    hashtag: tag,
    hashtags: [tag]
  }, (cb || function(){}) );
};

BrickCtr.extractId = function(id){
  var prefix = id.substr(0, 2);
  if (_.contains(['tw', 'in', 'tu', 'gi', 'vi'], prefix)) {
    return id.substr(2);
  }
  return id;
};

BrickCtr.getFromProvider = function(id, cb){
  var provider = this.guessProvider(id);

  if (! provider) {
    var msg = 'guessProvider failed for id: ' + id;
    logger.error('guessProvider-fail', { id: id });
    return cb(new Error(msg));
  }

  provider.mediaById(this.extractId(id), function(err, brick){
    if (err){
      cb(err);
    }
    cb(null, brick);
  });
};

BrickCtr.getById = function(id, cb){
  Brick.findOne({_id: id}, function(err, brick) {
    if (err) {
      cb(err);
    }
    if (!brick) {
      BrickCtr.getFromProvider(id, function(err, brick){
        if (err) {
          return cb(err);
        } else if (!brick) {
          var msg = 'Could not find brick by ID on the provider: ' + id;
          logger.error('getById-fail', {id: id});
          return cb(new Error(msg));
        } else {
          return cb(null, brick);
        }
      });
    } else {
      cb(null, brick);
    }
  });
};

BrickCtr.save = function(brick){
  var newBrick = new Brick(brick);
  newBrick.save();
};

module.exports = BrickCtr;
