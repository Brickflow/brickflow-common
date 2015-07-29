/* jshint camelcase: false */
'use strict';
var _ = require('lodash'),
    User = require('../model/user'),
    TumblrStrategy = require('passport-tumblr').Strategy,
    generateHash = require('../generateHash'),
    userCtr = require('../controller/userCtr'),
    createTracker = require('../metrics').createTracker;

module.exports = function (passport,
                           facebookAppId,
                           facebookAppSecret,
                           tumblrAppKey,
                           tumblrAppSecret) {

    passport.serializeUser(function(user, done) {
      done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        if(err) {
          return done(err, null);
        }
        else if(user && user._id){
          userCtr.onDeserializeUser(user, done);
        } else {
          done(err, user);
        }
      });
    });

    passport.use(new TumblrStrategy({
        consumerKey: tumblrAppKey,
        consumerSecret: tumblrAppSecret,
        callbackURL: '/auth/tumblr/callback',
        passReqToCallback: true
      },
      function(req, token, tokenSecret, profile, done) {
        console.time('lofaszkarika-use-callback-' + token);
        var followers;
        try {
          followers = JSON.parse(profile._raw).
            response.user.blogs.shift().followers;
        } catch (e) {
          followers = 0;
        }
        var distinct_id = '';
        var mixpanelCookieKey =
          _(Object.keys(req.cookies)).find(function(key) {
            return key.match(/mixpanel$/);
          });
        try {
          distinct_id = JSON.parse(req.cookies[mixpanelCookieKey]).distinct_id;
        } catch (e) {
          distinct_id = '';
        }

        User.findOrCreate(
          {
            tumblrUsername: profile.username
          },
          {
            tumblrFollowers: followers,
            tumblrUsername: profile.username,
            tumblrAccessToken: token,
            tumblrSecret: tokenSecret,
            hash: req.cookies.guest || generateHash(),
            mixpanelOriginalId: distinct_id
          },
          function (err, user, created) {
            var tracker = createTracker('user', req);
            if (err) {
              tracker.info('signin-fail');
              console.timeEnd('lofaszkarika-use-callback-' + token);
              return done(err);
            }
            if (created) {
              User.count({}, function(err, c) {
                tracker.info('register-success', {count: c});
              });
              userCtr.afterRegistration(user);
            } else if (user.tumblrAccessToken !== token ||
                       user.tumblrSecret !== tokenSecret) {
              tracker.info('login-success', {});
              user.tumblrAccessToken = token;
              user.tumblrSecret = tokenSecret;
              User.update({
                tumblrUsername: profile.username
              }, {
                tumblrAccessToken: token,
                tumblrSecret: tokenSecret
              }, _.noop);
            }
            req.session.wasRegistered = created;
            console.timeEnd('lofaszkarika-use-callback-' + token);
            return done(err, user);
          }
        );
      }
    ));
  };
