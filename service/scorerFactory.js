'use strict';

var _ = require('lodash');
// var logger = require('../logger').createLogger('score');
if (Math.tanh === undefined) {
  require('es6-shim'); // Math.tanh
}

function Scorer(scorerRules, infoObj) {
  this.rules = scorerRules;
  this.logInfo = infoObj || {};
}

Scorer.prototype.score = function(scorableItems) {
  var self = this;
  _(scorableItems).each(function(item) {
    item.score = self.getItemResult(item);
  });
};

Scorer.prototype.getItemResult = function(item) {
  return this.aggregateItemResults(this.getPartialItemResults(item));
};

Scorer.prototype.getPartialItemResults = function(scorableItem) {
  _.mapValues(this.rules, function(rule) { return rule.method(scorableItem); });
};

Scorer.prototype.aggregateItemResults = function(partialResult) {
  return _(partialResult).map(function(score, ruleName) {
    var resultScore;
    var rule = this.rules[ruleName];

    var weight = rule.weight;
    if (typeof weight === 'function') {
      weight = weight();
    }

    if (rule.saturation) {
      if (rule.saturation.min === -Infinity ||
          rule.saturation.max ===  Infinity) {
        // saturation * => [-1..1]
        resultScore = Math.tanh(
                        parseFloat(score) /
                        rule.saturation.treshold
                      );
      } else {
        // linear projection [min..max] => [0..1]
        resultScore = (parseFloat(score)   - rule.saturation.min ) /
                      (rule.saturation.max - rule.saturation.min );
      }
    }
    return resultScore * weight;
  }, this).reduce(function(sum, num) {
    return sum + num; // summarize these normalized values
  });
};

module.exports = function(loggerName, scorerRulesObject, loggerInfo) {
  var info = _.extend(loggerInfo || {}, {type: loggerName});
  var scorer = new Scorer(scorerRulesObject, info);
  return function(items) {
    scorer.score(items);
  };
};