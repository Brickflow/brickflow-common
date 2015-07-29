'use strict';
var _ = require('lodash');
var Flow = require('../model/flow');
var FlowCtr = {};

FlowCtr.get = function(name, cb) {
  Flow.findOne({name: name}, cb);
};

FlowCtr.set = function(name, bricks, cb) {
  cb = cb || _.noop;
  Flow.update({ name: name }, { $set: {
    bricks: bricks,
    updatedAt: new Date()
  }}, {
    upsert: true
  }, cb);
};

FlowCtr.getTrending = _.partial(FlowCtr.get, 'trending');
FlowCtr.setTrending = _.partial(FlowCtr.set, 'trending');

module.exports = FlowCtr;