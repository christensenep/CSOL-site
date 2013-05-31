const openbadger = require('../openbadger');
const db = require('../db');
const claim = db.model('Claim');
const isLearner = require('../middleware').isLearner;

module.exports = function (app) {

  app.get('/claim', [isLearner], function (req, res, next) {
    var claimCode = req.query.code;
    var user = res.locals.user;

    if (!claimCode)
      return res.render('claim.html');
    claimCode = claimCode.trim();

    openbadger.getBadgeFromCode({
      code: claimCode,
      email: user.email
    }, function(err, data) {
      if (err) {
        if (err.code === 404)
          req.flash('error', "That claim code appears to be invalid.");
        else if (err.code === 409)
          req.flash('warn', "You have already used that claim code.");
        else
          req.flash('error', "A problem was encountered.");
        return res.render('claim.html', {
          code: claimCode
        });
      }
      else {
        return res.render('claim.html', {
          code: claimCode,
          badge: data.badge
        });
      }
    });

  });

  app.post('/claim', [isLearner], function (req, res, next) {
    var claimCode = req.query.code;
    var user = res.locals.user;

    claim.findOrCreate({
      code: claimCode,
      LearnerId: user.id
    }).complete(function(err, claim) {
      if (err) {
        return next(err);
      }
      else {
        claim.submit(function(err, claim){
          if (err) {
            if (err.code === 409)
              req.flash('warn', "You already have that badge.");
            else
              req.flash('error', "There has been an error claiming your badge.");
          }
          else {
            if (claim.state === 'waiting')
              req.flash('info', "Your badge claim is awaiting approval from your parent or guardian.");
            else
              req.flash('success', "You've claimed a new badge!");
          }
          return res.redirect('/mybadges');
        });
      }
    });
  });

  app.get('/mybadges', [
    isLearner, 
    openbadger.middleware('getUserBadges')
  ], function (req, res, next) {
    var data = req.remote;

    res.render('user/backpack.html', {
      items: data.badges
    });
  });

  app.get('/mybadges/:id', [
    isLearner,
    openbadger.middleware('getUserBadge')
  ], function (req, res, next) {
    var data = req.remote;

    console.log(data.badge);
    res.render('user/badge.html', {
      badge: data.badge
    });
  });

  app.get('/favorites/:view?', function (req, res, next) {
    var badge = {
      thumbnail: '/media/images/badge.png',
      description: 'Badge blah in voluptate velit...',
      url: '/badges/ae784f'
    };

    var org = {
      thumbnail: '/media/images/org.png',
      description: 'Organisation blah irure...',
      url: '/orgs/some-organisation'
    };

    var program = {
      thumbnail: '/media/images/program.png',
      description: 'Program blah sed eiusmod...',
      url: '/programs/ae784f'
    };

    var view = req.params.view,
        favorites = [badge, org, badge, program];

    switch (view) {
      case 'badges':
        favorites = [badge, badge]; break;
      case 'programs':
        favorites = [program];
      case 'orgs':
        favorites = [org]; break;
      default:
        view = null;
    }

    res.render('user/bookmarks.html', {
      items: favorites,
      view: view
    })
  })

};