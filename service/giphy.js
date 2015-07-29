/* jshint camelcase: false */
'use strict';
var Client = require('node-rest-client').Client;
var _ = require('lodash');

/**
 * Example usage:
 var giphyFactory = require('./server/src/service/giphy');
 var giphy = giphyFactory ('dc6zaTOxFJmzC');
 var cb = function(resp,raw) { console.log('RESPONDED',resp,raw); });
 giphy.search('tits', cb);
 giphy.trending('tits', cb);
*/

var self;
var Giphy = function(apiKey) {
  this.apiKey = apiKey;
  this.client = this.initClient('http://api.giphy.com/v1/gifs');
  self = this;
};

Giphy.prototype.initClient = function(apiRootURL) {
  var client = new Client();
  _.each({
    search:   '/search?api_key=${key}&q=${q}',
    trending: '/trending?api_key=${key}',
    random:   '/random?api_key=${key}&tag=${tag}',
    gifs:     '?api_key=${key}&ids=${ids}',
    gif:      '/${id}?api_key=${key}'
  }, function(path, methodName) {
    client.registerMethod(methodName, apiRootURL + path, 'GET');
  });

  return client;
};

Giphy.prototype.call = function(method, params, cb) {
  if (typeof params === 'function') {
    cb = params;
    params = {};
  }
  cb = cb || function() {};
  this.client.methods[method]({
      path: _.assign(params, {key: this.apiKey})
    }, function(resp) { // , raw) {
      cb(null, resp);
    }
  ).on('error', cb);
};

Giphy.prototype.transformBrick = function(gif, tag, cb) {
  if (!gif) { return cb() }
  if (typeof tag === 'function') {
    cb = tag;
    tag = undefined;
  }
  var brick = {
    _id: 'gi' +  gif.id,
    media: gif.url,
    provider: 'giphy',
    likeCount: 0,
    hashtag: tag,
    url: gif.images.original.url,
    creatorName: gif.username || '',
    text: '',
    type: 'image',
    thumbnail: gif.images.original.url
  };

  return (typeof cb === 'function') ? cb(null, brick) : brick;
};

Giphy.prototype.search = function(q, cb) {
  this.call('search', {q: q}, function(err, resp) {
    cb(err, err ? null : _.map(resp.data, function(gif) {
      return self.transformBrick(gif, q);
    }));
  });
};

Giphy.prototype.trending = function(cb) {
  this.call('trending', function(err, resp) {
    cb(err, err ? null : _.map(resp.data, self.transformBrick));
  });
};


Giphy.prototype.mediaById = function(id, cb) {
  this.call('gif', {id: id}, function(err, resp) {
    cb(err, err ? null : self.transformBrick(resp.data));
  });
};

module.exports = function(apiKey) {
  return new Giphy(apiKey);
};