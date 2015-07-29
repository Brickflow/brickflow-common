'use strict';
var tumblrDirect = require('tumblr-pool.js');
var metrics = require('../../metrics'),
    config = require('../../config');
var transformBrick = require('./transformBrick');

var directClient = tumblrDirect.createClient({
  consumer_key: config.get('private:TUMBLR_APP_KEY'),
  consumer_secret: config.get('private:TUMBLR_APP_SECRET'),
  logger: metrics.createTracker('tumblrDirectConnection')
});

module.exports = function mediaById(id, cb){
  directClient.posts('blankname', {id: id}, function(err, reply) {
    return err ? cb(err) : transformBrick(reply.posts['0'], cb);
  });
};