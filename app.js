// i am importing dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
require('dotenv').config();

// express init
const app = express();

// mongo db connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// passport config
require('./config/passport')(passport);

// get the form data and url data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));

// start session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// user data avail in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// ejs
app.set('view engine', 'ejs');

// routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const adminRoutes = require('./routes/admin');

app.get('/', (req, res) => {
  res.render('login');
});

// Use routes
app.use('/auth', authRoutes);
app.use('/employee', employeeRoutes);
app.use('/admin', adminRoutes);

// ERROR HANDLING

// 404 - Page not found
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});