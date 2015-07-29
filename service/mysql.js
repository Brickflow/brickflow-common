'use strict';
var orm = require('orm');
var qOrm = require('q-orm');
var config = require('../config');

module.exports = qOrm.qConnect(config.get('MYSQL_URL') + '?pool=true');