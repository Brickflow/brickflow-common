'use strict';
var mongoose = require('mongoose'),
    findOrCreate = require('mongoose-findorcreate'),
    Schema = mongoose.Schema;

var BrickSchema = new Schema({
  _id: String,
  url: { type: String, index: true },
  media: String,
  provider: String,
  hashtag: String,
  hashtags: Array,
  creatorName: String,
  creatorId: String,
  creatorProfilePicture: String,
  type: String,
  text: String,
  thumbnail: String,
  likeCount: String,
  reblogKey: String,
  coordinates: [Number],
  createdAt: { type: Date, 'default': Date.now },
  postedAt:  { type: Date, 'default': Date.now }
});

BrickSchema.plugin(findOrCreate);

module.exports = mongoose.model('Brick', BrickSchema);
