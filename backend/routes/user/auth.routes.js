import express from 'express';
import passport from '../../config/passport.js';
import { UserAuthController } from '../../controllers/user/auth.controller.js';
import { GoogleAuthController } from '../../controllers/user/google-auth.controller.js';
import { authenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// Public routes - Email/Password Auth
router.post('/signup', UserAuthController.signup);
router.post('/login', UserAuthController.login);

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/login?error=google_auth_failed',
    session: false
  }),
  GoogleAuthController.googleAuthSuccess
);

// Protected routes (require authentication)
router.get('/profile', authenticateUser, UserAuthController.getProfile);
router.put('/profile', authenticateUser, UserAuthController.updateProfile);
router.post('/change-password', authenticateUser, UserAuthController.changePassword);

export default router;
