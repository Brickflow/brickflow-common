'use strict';
var _ = require('lodash');
var factory = require('amqp-rpc').factory;
var measure = require('./utils/measure');

var ACTIONS = ['register'];

var instances = {};
function getRPC(options) {
  if (!instances[options.url]) {
    instances[options.url] = factory(options);
  }
  return instances[options.url];
}

function createClient(options) {
  options = _.defaults(options || {}, {
    queueName: 'recommend-rpc',
    url: 'amqp://guest:guest@localhost:5672',
    exchange: 'recommend_rpc_exchange'
  });
  var logger = options.logger;

  var rpc = getRPC(_.pick(options, 'url', 'exchange'));

  function query(action) {
    var args = Array.prototype.slice.call(arguments, 0);
    var hasCb = typeof _.last(args) === 'function';
    var cb = hasCb ? _.last(args) : _.noop;
    var params = args.slice(1, hasCb ? -1 : undefined);
    var rpcParams = { action: action, params: params };
    logger.info(options.queueName + '-call', rpcParams);
    var dt = measure.time('recommend-rpc-client');
    rpc.call(options.queueName, rpcParams, function(err, res) {
      logger.info(options.queueName + '-response', _.assign(rpcParams, {
        running: dt.count('recommend-rpc-client'),
        duration: dt.end()
      }));
      cb(err, res);
    });
  }

  return _(ACTIONS).zipObject().mapValues(function (x, action) {
    return _.partial(query, action);
  }).value();
}


var config = require('../../config'),
    metrics = require('../../metrics');
module.exports = createClient({
  logger: metrics.createTracker('recommendRpc'),
  url: config.get('private:RABBITMQ_URL')
});

