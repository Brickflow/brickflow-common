'use strict';

var _ = require('lodash');
var Feed = require('../model/feed');

var FeedCtr = {
  // FeedCtr.get([user,] key, cb)
  get: function(key, cb) {
    Feed.findOne({ key: key }, function(err, res) {
      if (err) {
        cb(err);
      } else {
        cb(null, res ? res.value : null);
      }
    });
  },
  // FeedCtr.get([user,] key, value[, cb])
  set: function(key, value, cb) {
    cb = cb || _.noop;

    Feed.update({ key: key }, {
      $set: {
        value: value,
        updatedAt: new Date()
      }
    }, { upsert: true }, function(err) {
      cb(err, err ? null : value);
    });
  }
};

module.exports = FeedCtr;