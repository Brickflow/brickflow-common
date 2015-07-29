'use strict';
var _ = require('lodash');
var SearchCtr = {};

SearchCtr.interleaveBricks = function(destination, source) {
  source = _.clone(source);
  var n = Math.floor(destination.length / source.length) || 1;
  var interleaved = [];
  _(destination).groupBy(function(brick, idx) {
    return Math.floor(idx / n);
  }).each(function(bricks) {
    _(bricks).each(function(brick) {
      interleaved.push(brick);
    });
    if (source.length) {
      interleaved.push(
        _(source.shift()).extend({
          score: _.last(bricks).score
        }).value()
      );
    }
  });

  return _.flatten([
    interleaved,
    _.map(source, function(obj) {
      return _.extend(obj, {score: 0});
    })
  ]);
};


module.exports = SearchCtr;