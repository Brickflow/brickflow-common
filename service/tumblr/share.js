'use strict';
var _ = require('lodash');
var rabbitmq = require('../rabbitmq'),
    Post = require('../../model/post'),
    BrickCtr = require('../../controller/brickCtr'),
    getBrickflowURL = require('../../helpers/urlHelper').getBrickflowURL,
    tumblrLogger = require('../../metrics').createTracker('tumblr');

function getHashtagsFromBrick(brick){
  return _.isEmpty(brick.hashtags) ? brick.hashtag : brick.hashtags.join(',');
}

function getEmbedCode(brick) {
  if (brick.provider === 'instagram') {
    return '<iframe src="'+brick.media+'embed/" ' +
        'width="612" height="710" frameborder="0" scrolling="no" ' +
        'allowtransparency="true"></iframe>';
  } else {
    return '<iframe src="' + brick.media +
        '/embed/simple"></iframe>' +
        '<script src="//platform.vine.co/static/scripts/embed.js" ' +
        'async="" charset="utf-8"></script>';
  }
}

module.exports = function(options, callbackFn) {
  var utm = options.utmOptions || {
    source: 'tumblr',
    medium: 'organic',
    content: 'caption',
    campaign: options.user.tumblrUsername
  };

  options.selectedBlog = options.user.tumblrUsername + '.tumblr.com';
  var hashtag = options.brick.hashtag ?
      options.brick.hashtag : (options.brick.hashtags || [])['0'];

  if(hashtag === undefined) {
    hashtag = 'art';
  }

  var caption = {
    text: '',
    term: 'none'
  };

  var url = getBrickflowURL({
    utm: utm,
    term: caption.term,
    tag: hashtag
  });

  options.caption = caption.text.replace('brickflow.com', url);

  BrickCtr.save(options.brick);

  options.post = new Post({
    user: options.user.id,
    brick: options.brick._id,
    blog: options.selectedBlog
  });
  options.post.save();

  var tumblrPostOptions = {
    state: options.state,
    caption: options.caption,
    source: options.brick.url,
    source_url: options.brick.media
  };

  var shareDescriptor = {
    credentials: {
      token: '',
      token_secret: ''
    },
    command: '',
    args: []
  };

  if (options.brick.type === 'video') {
    _.assign(tumblrPostOptions, {
      tags: getHashtagsFromBrick(options.brick),
      embed: getEmbedCode(options.brick)
    });
    _.assign(shareDescriptor, {
      command: 'video',
      args: [options.selectedBlog, tumblrPostOptions]
    });
  } else if (options.brick.provider === 'tumblr') {
    var tumblrReblogOptions = {
      id: BrickCtr.extractId(options.brick._id),
      state: options.state,
      reblog_key: options.brick.reblogKey,
      comment: options.caption
    };
    _.assign(shareDescriptor, {
      command: 'reblog',
      args: [options.selectedBlog, tumblrReblogOptions]
    });
  } else {
    utm.content = 'image';

    var tags = getHashtagsFromBrick(options.brick);
    if (tags) {
      _.assign(tumblrPostOptions, { tags: tags });
    }
    _.assign(tumblrPostOptions, { link: url });

    _.assign(shareDescriptor, {
      command: 'photo',
      args: [options.selectedBlog, tumblrPostOptions]
    });
  }

  _.assign(shareDescriptor, {
    credentials: {
      token: options.user.tumblrAccessToken,
      token_secret: options.user.tumblrSecret
    },
    logInfo: {
      brickId: options.brick._id,
      tumblrUsername: options.user.tumblrUsername
    }
  });


  rabbitmq.publish('tumblr-queue', shareDescriptor);
  tumblrLogger.info('tumblr-share-queued',
      _.omit(shareDescriptor, 'credentials'));

  callbackFn(null);
};
