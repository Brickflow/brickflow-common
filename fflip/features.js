'use strict';
var features = {
  bestOf: {
    name: 'premium3',
    criteria: {
      premium3: true
    }
  },
  invite: {
    name: 'premium5',
    criteria: {
      premium5: true
    }
  },
  review: {
    name: 'premium7',
    criteria: {
      premium7: true
    }
  },
  noteCount: {
    name: 'noteCount',
    criteria: {
      allowUserIDs: 0 //
    }
  },
  oldFront: {
    name: 'oldFront',
    criteria: {
      percentageOfUsers: 0.5
    }
  },
  viralPostBrick: {
    name: 'viralPostBrick',
    criteria: {
      viralBrick: 0
    }
  },
  static: {
    name: 'static',
    criteria: {
      allowUserIDs: 0 //
    }
  },
  newDesign: {
    name: 'newDesign',
    criteria: {
      /*      allowUserIDs: [
       '5ac750730d0da37f2014212b103fc70b036878822f66726f',
       '180f57c97c886b50b03990028e78724bc7058cde2f66726f',
       '8eb00a81a49f83fa81a990f0d6d3ef67e45b606e2f66726f',
       '9f15e43e5b7ba81ed53d1c5a1523d2ba5ec1d3372f66726f',
       '9209557628e937ebcb571ea49b6a6332dd6774632f66726f',
       'a8a1ba7d8cdf21cae8718148b917d0dd72681c4d2f622f63',
       'c91caa1b950d46b01c8420b3f9de11dda7df4dff2f66726f',
       '3063d158a4c4e0544991a6f7b793ae7a32ad50562f66726f',
       '7aaea02487664320dbb1d4f16bcdc4b7d60143a82f66726f',
       '7a3366a7fb42b59ea891bac9690c27e7e0503ef12f66726f',
       '858aca2754132ac830e5fd78fbebdfe899ff14012f66726f',
       '59454de8a8121c22cac0c1a3eb63171c246df5532f66726f'
       ],*/
      all: null
//      percentageOfUsers: 0.2
      //isBrickflow: true
    }
  },
  ryanContentExperiment: {
    name: 'ryanContentExperiment',
    criteria: {
      percentageOfUsers: 0.5
    }
  },
  showcaseBestof: {
    name: 'showcaseBestof',
    criteria: {
      showcaseBestof: true
    }
  },
  showcaseInvite: {
    name: 'showcaseInvite',
    criteria: {
      showcaseInvite: true
    }
  },
  showcaseReview: {
    name: 'showcaseReview',
    criteria: {
      showcaseReview: true
    }
  },

  valuePropTestShare: {
    name: 'valuePropTestShare',
    criteria: {
      valuePropTestShare: true
    }
  },
  valuePropTestFind: {
    name: 'valuePropTestFind',
    criteria: {
      valuePropTestFind: true
    }
  },
  valuePropTestGet: {
    name: 'valuePropTestGet',
    criteria: {
      valuePropTestGet: true
    }
  },
  valuePropTestRun: {
    name: 'valuePropTestRun',
    criteria: {
      valuePropTestRun: true
    }
  },
  valuePropTestDiscover: {
    name: 'valuePropTestDiscover',
    criteria: {
      valuePropTestDiscover: true
    }
  },
  valuePropTestBuild: {
    name: 'valuePropTestBuild',
    criteria: {
      valuePropTestBuild: true
    }
  }
};
module.exports = features;
