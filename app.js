require('dotenv').config();
const express = require('express')
  , Liquid = require('liquidjs')
  , dbo = require('./lib/db.js')
  , engine = new Liquid()
  , session = require('express-session')
  , FileStore = require('session-file-store')(session)
  , bodyParser = require('body-parser')
  , path = require('path')
  , flash = require('flash')
  , compression = require('compression')
  , helmet = require('helmet')
  , moment = require('moment-timezone')
  , passport = require('passport')
  ;


dbo.connect(err => {

  if (err) {
    process.exit(0);
  }

  // Config
  const app = express();
  app.listen(process.env.PORT || 3000);

  moment.tz.setDefault();

  // Middlewares
  app.use(helmet());
  app.use(session({
    store: new FileStore(),
    secret: process.env.KEY,
    resave: false,
    ttl: 60 * 60 * 24 * 30,
    saveUninitialized: false
  }));
  app.engine('liquid', engine.express());
  app.set('view engine', 'liquid');
  app.set('views', __dirname + '/views');
  app.use(flash());
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(__dirname + '/static'));
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  require('./routes/main.js')(app, passport);

  // No matching route
  app.use((req, res, next) => {
    res.status(404)
      .send('Page not found.');
  });
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.end();
  });

  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
})
