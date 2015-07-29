'use strict';

var getAPI = require('./getAPI');

module.exports = function(user, inviteBlogName, cb) {
  getAPI(user).text(user.tumblrUsername, {
    state: 'published',
    tags: 'brickflow',
    title: 'Try Brickflow!',
    body: 'Hey <a class="tumblelog" href="http://' +
        inviteBlogName + '.tumblr.com">' + inviteBlogName + '</a>' +
        '! y u no come try this?'
  }, cb);
  console.log('INVITATION TO BE SENT')
};