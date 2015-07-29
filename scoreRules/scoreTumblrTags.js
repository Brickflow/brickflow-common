/* jshint camelcase: false */
'use strict';

var _ = require('lodash');

module.exports = {
  occurrenceCount: {
    weight: 1000,
    saturation: {
      min: 0,
      max: Infinity,
      treshold: 20
    },
    method: function(tagObject) {
      return _(tagObject.occurrences).map(function(occurrence) {
        return occurrence.post.noteCount;
      }).reduce(function(sum, num) {
        return sum + num;
      });
    }
  }
};