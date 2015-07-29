'use strict';
var _ = require('lodash');

var InteractionMongo = require('../model/interaction');
var InteractionSQL = require('../model/mysql/interaction');

var exclude = require('../service/recommend/exclude');
var metrics = require('../metrics');
var logger = metrics.createTracker('interactionCtr');
var mysqlLogger = metrics.createTracker('mysql');

function add(action, blogName, entity, cb) {
  var interaction = {
    blogName: blogName,
    entityId: entity.name || entity._id || entity.id || entity,
    action: action,

    hashtags: entity.hashtags || [],
    originallyPostedBy: entity.creatorName,
    createdAt: new Date
  };
  var doc = new InteractionMongo(interaction);
  doc.save(cb);
  InteractionSQL.then(function(sql) {
    interaction.hashtags = interaction.hashtags ?
        interaction.hashtags.join(';') : '';
    sql.create([interaction], function(err) {
      if (err && err.code !== 'ER_DUP_ENTRY') {
        mysqlLogger.error('mysqlQuery', _.assign({
          status: 'error',
          stack: err.stack,
          happenedAt: new Date
        }, interaction));
      } else {
        mysqlLogger.info('mysqlQuery', _.assign({
          status: 'success',
          happenedAt: new Date
        }, interaction));
      }
    });
  });
}

function addInit() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = args[0] + '.initial'; // actions' suffix
  add.apply(null, args);
}

// method name --> action string in db
var setterActionMapping = {
  dismissedBlog: 'dismiss.blog',
  dismissed: 'dismiss.brick',
  viewed: 'view.brick',
  shared: 'share.brick',
  followed: 'follow.blog'
};

module.exports = {
  forUser: function(userOrName) {
    var tumblrUsername = userOrName.tumblrUsername || userOrName;
    return _(setterActionMapping).mapValues(function(action) {
      return _.partial(add, action, tumblrUsername);
    }).assign({
      exclude: _.mapValues(exclude, function(fn) {
        return typeof fn === 'function' ? _.partial(fn, tumblrUsername) : fn;
      })
    }).value();

  },
  forNewUser: function(userOrName) {
    return _.mapValues(setterActionMapping, function(action) {
      return _.partial(addInit, action, userOrName.tumblrUsername ||userOrName);
    });
  },
  bulkAdd: function bulkAdd(payload, options, cb) {
    if (typeof options === 'function') {
      cb = options; options = {}; }

    InteractionMongo.collection.insert(_.map(payload, function (doc) {
      return _.assign(doc, {
        createdAt: new Date
      });
    }), options, cb || _.noop);
    InteractionSQL.create(payload);
  },
  getBlogsByTags: function(tags, cb) {
    InteractionMongo.find({ hashtags: {$in: tags } }, function(err, interactions) {
      cb(err, _(interactions).pluck('blogName').uniq().value());
    });
  }
};