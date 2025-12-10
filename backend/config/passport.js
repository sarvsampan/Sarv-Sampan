import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const googleUserData = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          avatarUrl: profile.photos?.[0]?.value || null,
          emailVerified: profile.emails?.[0]?.verified || false,
        };

        // Pass the user data to the controller
        return done(null, googleUserData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// No serialization needed for stateless JWT authentication
// These are required by Passport but won't be used
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
