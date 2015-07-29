'use strict';

var config = require('../config');
var sharabilities = config.get('PROVIDER_LIMITS');

module.exports = {

  likeCount: {
    weight: 15,
    saturation: {
      min: 0,
      max: Infinity,
      treshold: 300
    },
    method: function(brick) {
      return brick.likeCount || 0;
    }
  },

  aging: {
    weight: 20,
    saturation: {
      min: -Infinity,
      max: 0,
      treshold: 10 // days
    },
    method: function(brick) {
      var hoursPassed = Math.round(
              (new Date() -     // now
               new Date(brick.postedAt||brick.createdAt)) /
              1000 / 3600 // milliseconds --> hours
      );
      return -1 * hoursPassed;
    }
  },

  provider: {
    weight: 30,
    saturation: {
      min: 0,
      max: 1
    },
    method: function(brick) {
      // https://drive.google.com/#folders/0B1SEHyHvzDjNYzJSb3hLTzFybWc
      // Sharability.
      return sharabilities[brick.provider];
    }
  }
};