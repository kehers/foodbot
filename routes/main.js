const { render } = require('../lib/utils.js')

  , SlackStrategy = require('@aoberoi/passport-slack').default.Strategy
  , Slack = require('../models/slack.js')
  , Accounts = require('../models/accounts.js')
  , _ = require('lodash')
  ;

module.exports = (router, passport) => {

  passport.use('slack', new SlackStrategy({
    clientID: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    callbackURL: process.env.SLACK_CB,
    skipUserProfile: true,
    state: true
  }, (token, scopes, team, { bot, incomingWebhook }, profile, done) => {
    if (token && team)
      return done(null, {
        token: token
        , team: team
      });
    else
      return done('Error authenticating your Slack account.');
  }));

  // New signup
  router.get('/auth', passport.authenticate('slack', {
    scope: ['chat:write:bot', 'channels:read']
  }));
  router.get('/auth/cb', (req, res, next) => {
    passport.authenticate('slack', (err, profile) => {
      if (err || !profile.team || !profile.token || !profile.team.id) {
        req.flash('error', 'There has been an authentication error.' +
          ' Please try again later');

        bugsnagClient.notify(err);
        return res.redirect('/');
      }

      req.login(profile, err => {
        if (err)
          req.flash('error', 'There has been a login error.' +
            ' Please try again later.');

        //return res.redirect('/day/'+(new Date()).toISOString().substring(0, 10));
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  });

  router.get('/', async (req, res) => {
    res.render('index', render(req));
  });
  router.post('/', async (req, res) => {
    try {
      res.end();

      const body = JSON.parse(req.body.payload);
      console.log(body);

      if (!body.type)
        return;

      if (body.type != 'block_actions')
        return;

      await Accounts.log(body);
    }
    catch (e) {
      console.log(e);
      res.end();
    }
  })

  router.get('/dashboard', async (req, res) => {
    try {
      const responses = await Accounts.todaysPoll(req.user.team.id);
      if (responses && responses.length) {
        const groupBy = key => responses =>
          responses.reduce((accumulator, obj) => {
            const value = obj[key];
            accumulator[value] = (accumulator[value] || []).concat(obj);
            return accumulator;
          }, {});
        const groupBySelection = groupBy('selection');
        const obj = JSON.stringify(groupBySelection(responses));
        res.render('poll-stats', render(req, {
          responses, obj
        }));
        const channels = await Slack.getChannels(req.user.token);
        res.render('new-poll', render(req, {
          channels
        }));
      }
    }
    catch (e) {
      // ??
      console.log(e);
      res.redirect('/');
    }
  });
  router.post('/dashboard', async (req, res) => {
    try {
      const response = await Accounts.updatePoll(req.user.team.id, req.user.token, req.body);
      req.flash('info', 'Food options sent');
      res.redirect('/dashboard');
    }
    catch (e) {
      req.flash('error', e.message ? e.message : 'There has been an error. Try again later');
      res.redirect('/dashboard');
    }
  });

  // Logout
  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });
}
