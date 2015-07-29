'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
  user: String,
  brick: String,
  blog: String,
  tumblrId: Number,
  baseNoteCount: Number,
  lastKnownNoteCount: Number,
  lastNoteCountCheckAt: Date,
  createdAt: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
