'use strict';
var _ = require('lodash');

function sum(s,n){ return s+n; }

module.exports = {
  saturation: {
    range: function(min, max) {
      return {
        min: min,
        max: max
      };
    },
    rangeOfRuleset: function(ruleset) {
      return {
        min: 0,
        max: _(ruleset).map('weight').reduce(sum)
      };
    },
    gteZeroWithTreshold: function(treshold) {
      return {
        min: 0,
        max: Infinity,
        treshold: treshold
      };
    },
    lteZeroWithTreshold: function(treshold) {
      return {
        min: -Infinity,
        max: 0,
        treshold: Math.abs(treshold)
      };

    }
  }
};