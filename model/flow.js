'use strict';
var mongoose = require('mongoose');

var FlowSchema = new mongoose.Schema({
  name: {type: String, index: {unique: true}},
  thumbnail: String,
  hashtag: {type: String, 'default': null},
  bricks: Array,
  updatedAt: {type: Date, 'default': new Date()}
});

module.exports = mongoose.model('Flow', FlowSchema);