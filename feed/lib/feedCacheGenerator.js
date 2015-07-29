'use strict';
var _ = require('lodash');
var FeedCtr = require('../../controller/feedCtr');
var UserCtr = require('../../controller/userCtr');
var InteractionCtr = require('../../controller/interactionCtr');
var config = require('../../config');

var metrics = require('../../metrics');
var logger = metrics.createTracker('feedCache');

var brickflowRecommendClient = require('brickflow-recommend-client');
var recommendClient = brickflowRecommendClient({
  logger: metrics.createTracker('recommendClient'),
  url: config.get('RABBITMQ_URL')
});

module.exports = function feedCacheGenerator(p) {
  _.defaults(p, {
    key: null, // Feed#key, required

    // only applicable for unseen
    type: 'bricks', // bricks||blogs

    // fetches the content to cache
    fetch: function(user, cb) { cb(null, []); },

    // parses the result after came back from fetch(cb):
    parse: function(res) {
      return res && (res.bricks || res.blogs || res);
    },

    // the value from the database (an array of bricks/blogs) will be formatted
    // with this function, e.g. wrap it into a status object
    format: function(res) { // function(res, user) {
      return res;
    },

    getter: undefined, // function getter([user, ]key, cb)
    setter: undefined, // function setter([user, ]key, value, cb)

    rpcUpdate: true
  });

  var update = p.rpcUpdate ? remoteUpdateFeedCache : updateFeedCache;

  function getGetter(user) {
    if (p.getter) {
      return user ? _.partial(p.getter, user) : p.getter;
    } else {
      return user ? _.partial(UserCtr.getFeed, user) : FeedCtr.get;
    }
  }

  function getSetter(user) {
    if (p.setter) {
      return user ? _.partial(p.setter, user) : p.setter;
    } else {
      return user ? _.partial(UserCtr.setFeed, user) : FeedCtr.set;
    }
  }

  function updateFeedCache(user, cb, raw) {
    if (typeof user === 'function') {
      cb = user;
      user = null;
    }
    var logInfo = {
      tumblrUsername: user ? user.tumblrUsername : null,
      cacheKey: p.key,
      hasCallback: typeof cb === 'function'
    };

    var fetchFn = (user) ? _.partial(p.fetch, user) : p.fetch;
    fetchFn(function(err, res) {
      if (err) {
        logger.error('updateFeedCache-' + p.key, _.assign(logInfo, {
          err: err,
          stack: err.stack
        }));
        return cb(err);
      }

      var payload = res ? p.parse(res) : []; // array of contents to cache
      if (payload.length) {
        _.assign(logInfo, { payloadLength: payload.length });
        getSetter(user)(p.key, payload, _.noop);
      }
      if (cb) {
        cb(null, raw === true ? payload : p.format(payload));
      }
      if (payload.length) {
        logger.info('updateFeedCache-' + p.key + '-success', logInfo);
      } else {
        logger.error('updateFeedCache' + p.key + '-empty', logInfo)
      }
    });
  }

  function remoteUpdateFeedCache() {
    var args = Array.prototype.slice.call(arguments, 0, 2);
    args.unshift(p.key);
    recommendClient.updateFeedCache.apply(null, args);
  }

  function getFeedCache(updateApproach, user, cb, raw) {
    if (typeof user === 'function') {
      raw = cb;
      cb = user;
      user = null;
    }
    var logInfo = {
      tumblrUsername: user ? user.tumblrUsername : null,
      cacheKey: p.key,
      feedStatus: 'empty'
    };

    logger.info('getFeedCache-' + p.key + '-start');

    getGetter(user)(p.key, function(err, res) {
      if (err) {
        logger.error('getFeedCache-' + p.key + '-error', _.assign(logInfo, {
          update: true,
          feedStatus: 'error',
          err: err,
          stack: err.stack
        }));
        return cb(err);
      }

      var payload = p.parse(res);
      if (payload && payload.length) {
        (cb || _.noop)(null, raw ? payload : p.format(payload));
        if (updateApproach !== 'fallbackOnly') {
          update(user, _.noop, raw);
        }
        _.assign(logInfo,
            { feedStatus: 'success', payloadLength: payload.length });
        logger.info('getFeedCache-' + p.key + '-success', logInfo);
      } else if (_.contains(['blocking', 'fallbackOnly'], updateApproach)) {
        update(user, function(err, res) {
          logger.info('getFeedCache-' + p.key + '-success', _.assign(logInfo,
              { updated: true }));
          cb(err, res);
        }, raw);
        logger.info('getFeedCache-' + p.key + '-empty', logInfo);
      } else {
        cb(null, []);
        if (updateApproach !== 'none') {
          update(user, _.noop, raw);
        }
        logger.info('getFeedCache-' + p.key + '-empty', logInfo);
      }
    });
  }

  function getFiltered(updateApproach, filterUser, raw) {
    var args = Array.prototype.slice.call(arguments, 2);
    var cb = args.pop();
    if (typeof cb !== 'function') {
      throw new Error('No callback were provided');
    }
    args.unshift(updateApproach);
    args.push(function callthrough(err, res) {
      return err ? cb(err) : InteractionCtr.forUser(filterUser).
          exclude.seen(p.type, p.parse(res), function(err, unseen) {
            cb(err, err ? null : (raw === true ? unseen : p.format(unseen)));
          });
    });
    getFeedCache.apply(null, args);
  }

  var inMemoryCache = null;
  function getInMemoryCached() {
    var logInfo = {
      cacheKey: p.key,
      inMemory: true,
      feedStatus: 'empty'
    };
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    if (typeof cb !== 'function') {
      throw new Error('No callback were provided');
    }
    if (inMemoryCache !== null) {
      logger.info('getFeedCache-' + p.key,
          _.assign(logInfo, { feedStatus: 'success' }));
      cb(null, inMemoryCache);
    } else {
      args.push(function callthrough(err, res) {
        logInfo.feedStatus = err ? 'empty' : 'success';
        logger.info('getFeedCache-' + p.key + '-fetchToMemory', logInfo);
        inMemoryCache = res;
        cb(err, res);
      });
      getFeedCache.apply(null, args);
    }
  }

  function gettersFor(fn) {
    return {
      getSync:    _.partial(fn, 'blocking'),
      getCurrent: _.partial(fn, 'none'),
      getLazy:    _.partial(fn, 'empty'),
      getOnce:    _.partial(fn, 'fallbackOnly')
    };
  }

  return _.assign({
    // updaters
    update: remoteUpdateFeedCache,
    updateNow: updateFeedCache,

    // Interaction-based content filtering:
    unseen: gettersFor(getFiltered),

    inMemory: gettersFor(getInMemoryCached)
    // Basic feed cache
  }, gettersFor(getFeedCache));
};