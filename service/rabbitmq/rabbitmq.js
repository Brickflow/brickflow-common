'use strict';

var _ = require('lodash');
var config = require('../../config');
var logger = require('../../metrics').createTracker('rabbitmq');

var internalQueue = [];
var ready = null;

var mq = require('./connection');

//var NON_PERSISTENT_DELIVERY = 1;
var PERSISTENT_DELIVERY = 2;
var persistentQueue = {durable: true, mandatory: true, autoDelete: false};


function publish(key, value) {
  if (ready) {
    mq.publish(key, JSON.stringify(value), {
      deliveryMode: PERSISTENT_DELIVERY,
      contentType: 'application/json',
      timestamp: Date.now()
    });
  } else {
    internalQueue.push({key: key, value: value});
  }
}

function subscribe(queueName, queueParams, handler) {
  var initQueue = function() {
    if (typeof queueParams === 'function') {
      handler = queueParams;
      queueParams = null;
    }
    if (! queueParams) {
      queueParams = persistentQueue;
    }
    mq.queue(queueName, queueParams, handler ? function(q) {
      q.subscribe(handler);
    } : _.noop);
  };

  if (!ready) {
    mq.on('ready', function() {
      initQueue(queueName, queueParams, handler);
    });
  } else {
    initQueue(queueName, queueParams, handler);
  }

}

// initialize/config:
mq.on('ready', function() {
  ready = true;

  subscribe('blogs');
  subscribe('tumblr-queue');

  logger.info('rabbitmq-ready');

  _(internalQueue).each(function(item) {
    publish(item.key, item.value);
  });
  if (internalQueue.length) {
    logger.debug('rabbitmq-internal-queue-flushed', {
      length: internalQueue.length
    });
  }
  internalQueue = [];
});

mq.on('close', function(err) {
  if (ready || ready === null) {
    logger.error('rabbitmq-close', { err: err, stack: err.stack });
  }
  ready = false;
});

mq.on('error', function(err) {
  if (ready || ready === null) {
    logger.error('rabbitmq-error', { err: err, stack: err.stack });
  }
  ready = false;
});

module.exports = {
  on: subscribe,
  subscribe: subscribe,
  send: publish,
  publish: publish
};

