const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // If user doesn't exist
        if (!user) {
          return done(null, false, { message: 'Email not found' });
        }
        
        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }
        
        // Return user
        return done(null, user);
        
      } catch (err) {
        return done(err);
      }
    })
  );

  // SAVE to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
// get user data from db

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
