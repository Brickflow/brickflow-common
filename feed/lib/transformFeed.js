'use strict';

var _ = require('lodash');
var config = require('../../config');

var scorerFactory = require('../../service/scorerFactory');
var scoreRules = require('../../scoreRules/scoreBrick');

var providerLimits = config.get('PROVIDER_LIMITS');
var desiredCount = config.get('DESIRED_FEED_LENGTH');

var self = {
  brickScoreDESC: function brickScoreDESC(brick) {
    return -1 * brick.score;
  },
  scoreAsyncParallelResponse: function(bricksByProvider) {
    return _(self.scoreByProvider(bricksByProvider)).
        values().
        flatten().
        sortBy(self.brickScoreDESC).
        value();
  },
  scoreByProvider: function scoreByProvider(bricksByProvider, options) {
    var scoreBricks = scorerFactory('scoreBrick',  scoreRules, options);
    return _.mapValues(bricksByProvider, function(providerBricks) {
      scoreBricks(providerBricks);
      return _(providerBricks).compact().sortBy(self.brickScoreDESC).value();
    });
  },
  limitByProvider: function limitByProvider(bricksByProvider) {
    var providerCounts = _.mapValues(bricksByProvider, 'length');

    var sumOfNonEmptyProviderLimits =
        _(providerLimits).filter(function(v, k) {
          return providerCounts[k] > 0;
        }).reduce(function(acc, limit) {
          return acc + limit;
        }, 0);

    var totalCount = _.reduce(bricksByProvider, function(acc, bricks) {
      return acc + bricks.length;
    }, 0);

    if (totalCount <= desiredCount) {
      return bricksByProvider;
    }

    bricksByProvider = _.mapValues(bricksByProvider,
        function(bricks, provider) {
          var limit = Math.ceil(desiredCount * providerLimits[provider] /
                                sumOfNonEmptyProviderLimits);
          return _.first(bricks, limit);
        });

    return bricksByProvider;
  },

  groupByProvider: function groupByProvider(bricks) {
    return _.groupBy(bricks, 'provider');
  },

  groupAndLimitByProvider: function groupAndLimitByProvider(bricks) {
    return self.limitByProvider(self.groupByProvider(bricks));
  }
};

module.exports = self;

