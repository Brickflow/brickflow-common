'use strict';
var brickflowUserNames = [
  'captainjudikdavid',
  'rebeca-polley',
  'dan-figureitout',
  'nagydan1',
  'ifroz',
  'supercellcat',
  'eggdice',
  'peterlangmar'
];
var Criteria = {
  percentageOfUsers: function(user, percent) {
    var id = parseInt((user.hash || '').substr(5), 16);
    return (id % 100 < percent * 100) || isBrickflow(user);
  },
  allowUserIDs: function(user, idArr) {
    for(var id in idArr) {
      if(user.hash === idArr[id]){
        return true;
      }
    }
    return false;
  },
  viralBrick: getDivide(3, 1, 1),
  premium3: getDivide(3, 0, 3),
  premium5: getDivide(3, 1, 3),
  premium7: getDivide(3, 2, 3),

  showcaseBestof: getDivide(3, 0, 4),
  showcaseInvite: getDivide(3, 1, 4),
  showcaseReview: getDivide(3, 2, 4),

  valuePropTestShare: getDivide(6, 0, 5),
  valuePropTestFind: getDivide(6, 1, 5),
  valuePropTestGet: getDivide(6, 2, 5),
  valuePropTestRun: getDivide(6, 3, 5),
  valuePropTestDiscover: getDivide(6, 4, 5),
  valuePropTestBuild: getDivide(6, 5, 5),

  isBrickflow: function(user) {
    return isBrickflow(user);
  },
  all: function() {
    return true;
  }
};

function isBrickflow(user) {
  if (brickflowUserNames.indexOf(user.tumblrUsername) !== -1) {
    return true;
  }
  return false;
}

function getDivide(divide, modulo, startIndex){
  startIndex = (startIndex || 0);
  return function(user){
    var probability = parseInt(user.hash.substr(startIndex,1), 16) % divide;
    return (probability === modulo);
  };
}

module.exports = Criteria;
