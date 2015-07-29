var rabbitmq = require('./rabbitmq');
var tumblr = require('../tumblr');

rabbitmq.on('tumblr-queue-success', tumblr.onQueueSuccess);