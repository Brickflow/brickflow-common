var config = require('./config');
var rabbitmqConnection = require('./service/rabbitmq/connection');

module.exports = require('brickflow-logger')({
  logstash: {
    port: config.get('LOGSTASH_PORT'),
    nodeName: config.get('LOGSTASH_APP_NAME'),
    host: config.get('private:LOGSTASH_HOST')
  },
  amqp: { connection: rabbitmqConnection }
});