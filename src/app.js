const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const appConfig = require('./config');
const { globalErrorHandler } = require('./middlewares/error.middleware'); 
const viewIndexRoutes = require('./routes/view/index.routes');
const viewAuthRoutes = require('./routes/view/auth.routes');
const viewDashboardRoutes = require('./routes/view/dashboard.routes');
// const apiAuthRoutes = require('./routes/api/auth.routes');
// const apiWebsiteRoutes = require('./routes/api/website.api.routes');
const siteRoutes = require('./routes/site.routes'); 
const app = express();
app.set('config', appConfig);
const mongooseConnectionPromise = mongoose.connect(appConfig.mongodbUri)
  .then((m) => {
    console.log('MongoDB Connected to WanzOFC Site Builder DB...');
    return m.connection; 
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Exiting application due to database connection failure.');
    process.exit(1);
  });
app.use(expressLayouts); 
app.set('layout', './layouts/main');
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(cors({
    origin: '*', 
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: appConfig.session.secret, 
  resave: appConfig.session.resave, 
  saveUninitialized: appConfig.session.saveUninitialized, 
  store: MongoStore.create({ 
    mongoUrl: appConfig.mongodbUri, 
    collectionName: 'app_sessions',
    ttl: 14 * 24 * 60 * 60, 
    autoRemove: 'native',
    crypto: {
    }
  }),
  cookie: appConfig.session.cookie 
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); 
  res.locals.currentUser = req.user || null;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.appName = "WanzOFC Site Builder"; 
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', viewIndexRoutes); 
app.use('/auth', viewAuthRoutes); 
app.use('/dashboard', viewDashboardRoutes); 
app.use('/s', siteRoutes);
app.use((req, res, next) => {
  const error = new Error(`Oops! The page you are looking for at '${req.originalUrl}' was not found on WanzOFC Site Builder.`);
  error.statusCode = 404;
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      status: 'fail',
      message: 'API endpoint not found.'
    });
  }
  res.status(404).render('pages/errors/404', {
    title: '404 Not Found - WanzOFC Site Builder',
    layout: 'layouts/main', 
    message: error.message,
    statusCode: 404
  });
});
app.use(globalErrorHandler);
module.exports = app;