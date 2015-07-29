'use strict';
var _ = require('lodash'),
    async = require('async'),
    moment = require('moment');
var measure = require('./utils/measure');
var Interaction = require('../../model/interaction');
var InteractionSQL = require('../../model/mysql/interaction');
var logger = require('../../metrics').createTracker('recommendExclude');

var fieldNames = {
  bricks: '_id',
  blogs: 'name'
};

function seenFromMysql(userOrName, pluralType, bricksOrBlogs, callback) {
  //  return callback(null, bricksOrBlogs); // DISABLED
  var dt = measure.time('mysql-interaction');

  InteractionSQL.then(function(sql) {
    var promiseDuration = dt.lap();
    var where;
    if (pluralType === 'bricks') {
      where = [
        ['action != ?', ['view.brick']],
        ['action = ? AND createdAt < ?', ['view.brick', moment().subtract(8, 'hours').toDate()]]
      ];
    } else {
      where = [false];
    }
    var find = {
      blogName: (userOrName.tumblrUsername || userOrName).toString(),
      entityId: _(bricksOrBlogs).pluck(fieldNames[pluralType]).map(function(s) {
        return s.toString();
      }).compact().value()
    };

    async.map(where, function(w, cb) {
      var query = sql.find(find);
      if (w !== false) {
        query.where.apply(query, w);
      }
      query.all(cb);
    }, function(err, res) {
      var field = fieldNames[pluralType];
      var queryDuration = dt.lap();
      var alreadySeen = _.intersection(
          _(res||[]).flatten().pluck('entityId').uniq().value(),
          _.pluck(bricksOrBlogs, field));
      var unionDuration = dt.lap();
      var result = _.reject(bricksOrBlogs, function(b) {
        return _.contains(alreadySeen, b[field]);
      });
      logger[err ? 'error' : 'info']('exclude', _.assign({
        err: err ? err : undefined,
        stack: err ? err.stack : undefined,
        blogName: userOrName.tumblrUsername || userOrName,
        db: 'mysql',
        running: dt.count('mysql-interaction'),
        promiseDuration: promiseDuration,
        queryDuration: queryDuration,
        unionDuration: unionDuration,
        totalDuration: dt.end()
      }));
      callback(err, result);
    });
  });
}

function seenFromMongo(userOrName, typePlural, bricksOrBlogs, callback) {
  var dt = measure.time('mongo-interaction');

  var type = typePlural.replace(/s$/, '');
  var queries = [{
    blogName: userOrName.tumblrUsername || userOrName,
    entityId: { $in: _.pluck(bricksOrBlogs, fieldNames[typePlural]) },
    action: (type === 'brick') ?
    { $regex: type, $ne: 'view.brick' } :
    { $regex: type },
    createdAt: {
      $gte: moment().subtract(7, 'days').toDate()
    }
  }];
  if (type === 'brick') {
    queries.push({
      blogName: userOrName.tumblrUsername || userOrName,
//      entityId: { $in: _.pluck(bricksOrBlogs, fieldNames[typePlural]) },
      createdAt: {
        $gte: moment().subtract(7, 'days').toDate(),
        $lte: moment().subtract(8, 'hours').toDate()
      },
      action: 'view.brick'
    });
  }
  async.map(queries, function(q, cb) {
    Interaction.find(q, {entityId: true}, cb);
  }, function(err, res) {
    var queryDuration = dt.lap();
    var alreadySeen = _(res).flatten().pluck('entityId').uniq().value();
    callback(err, err ? null : _.reject(bricksOrBlogs, function(b) {
      logger[err ? 'error' : 'info']('exclude', {
        blogName: userOrName.tumblrUsername || userOrName,
        db: 'mongo',
        running: dt.count('mongo-interaction'),
        queryDuration: queryDuration,
        totalDuration: dt.end()
      });
      return _.contains(alreadySeen, b[fieldNames[typePlural]]);
    }));
  });
}

module.exports = { seen: seenFromMysql };