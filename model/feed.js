'use strict';
var mongoose = require('mongoose');

var FeedSchema = new mongoose.Schema({
  key: {type: String, index: {unique: true}},
  value: Array,
  updatedAt: {type: Date, 'default': new Date()}
});

module.exports = mongoose.model('Feed', FeedSchema);