'use strict';

var mongoose = require('mongoose');

var InteractionSchema = new mongoose.Schema({
  blogName: {type: String, required: true, index: true},
  entityId:  {type: String, required: true, index: true},
  action:   {type: String, required: true},

  // TODO: better name for this + clarify meaning when non-tumblr
  originallyPostedBy: String,
  hashtags: {type: Array, default: []},

  createdAt: { type: Date, 'default': Date.now }
});
InteractionSchema.index({blogName: 1, entityId: 1, action: 1}, {
  unique: true,
  dropDups: true
});

module.exports = mongoose.model('Interaction', InteractionSchema);
