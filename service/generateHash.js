'use strict';

var _ = require('lodash');
var crypto = require('crypto');

module.exports = function(path) {
  var seed = crypto.randomBytes(20);
  if (path === '/' || !path) {
    path = '/front';
  }
  var pathHash = _(path.substr(0, 4)).map(function(e) {
    return e.charCodeAt(0).toString(16);
  }).value().join('');
  return crypto.createHash('sha1').update(seed).digest('hex') + pathHash;
};
