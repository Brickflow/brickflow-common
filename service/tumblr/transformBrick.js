'use strict';
var _ = require('lodash');
var prefix = 'tu';
module.exports = function(brick, callback) {
  if (! brick || _.contains(['video', 'photo'], brick.type) === false ) {
    return callback(null, undefined);
  }

  return callback(null, {
    _id: prefix + brick.id,
    media: brick.post_url,
    provider: 'tumblr',
    url: (brick.type === 'photo') ?
        brick.photos[0].original_size.url : brick.video_url,
    creatorName: brick.blog_name,
    creatorProfilePicture: 'http://api.tumblr.com/v2/blog/' +
        brick.blog_name + '.tumblr.com/avatar/48',
    text: brick.caption ? brick.caption : '',
    type: (brick.type === 'photo') ? 'image' : 'video',
    thumbnail: (brick.type === 'photo') ?
        brick.photos[0].original_size.url : brick.thumbnail_url,
    score: brick.score,
    createdAt: new Date(),
    postedAt:  brick.date,
    likeCount: brick.note_count,
    reblogKey: brick.reblog_key,
    source_url: brick.link_url, //source_url
    source_title: brick.source_title
  });
};