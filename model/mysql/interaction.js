'use strict';
var mysql = require('../../service/mysql');
module.exports = mysql.then(function(db) {
  var Interaction = db.define('interactions', {
    /*
     ALTER TABLE `interactions`
     ADD UNIQUE `uniqueTogether` (`blogName`, `entityId`, `action`)
     */
    blogName: String,
    entityId: String,
    action: String,

    originallyPostedBy: String,
    hashtags: { type: 'text' },

    createdAt: {type: 'date', time: true}
  }, {
    hooks: {
      beforeCreate: function() {
        if (!this.originallyPostedBy) {
          this.originallyPostedBy = '';
        }
      }
      // afterLoad: function() {
        // var tags = this.hashtags || '';
        // this.hashtags = tags.split(';');
      // }
    }
  });
  return Interaction;
});