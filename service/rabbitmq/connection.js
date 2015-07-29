'use strict';
var amqp = require('amqp'),
    cfg = require('../../config');
module.exports = amqp.createConnection(cfg.get('private:RABBITMQ_CREDENTIALS'));