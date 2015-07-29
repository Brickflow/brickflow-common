var nconf = require('nconf');

var ENV = process.env.BF_ENVIRONMENT || 'DEV';
var lowerEnv = ENV.toLowerCase();

nconf.add('local', {
  type: 'file',
  file: __dirname + '/local.json'
});

nconf.add(lowerEnv, {
  type: 'file',
  file: __dirname + '/' + lowerEnv + '.json'
});

nconf.add('global', {
  type: 'file',
  file: __dirname + '/global.json'
});

nconf.set('ENVIRONMENT', ENV.toUpperCase());

module.exports = nconf;
