'use strict';

var self = {
  needsRefresh: function(user, hours) {
    var now = new Date(),
        last = user.lastSeenAt || new Date();
    last.setHours(last.getHours() + hours);
    return (now > last);
  },

  refresh: function(user, hours) {
    if (self.needsRefresh(user, hours)) {
      var prevDate = user.lastSeenAt;
      user.lastSeenAt = new Date();
      user.save();
      return prevDate;
    }
    return null;
  }
};

module.exports = self;