import { asyncHandler } from '../../middlewares/async.middleware.js';
import { UserAuthService } from '../../services/user/auth.service.js';

export class GoogleAuthController {
  /**
   * Handle successful Google OAuth callback
   * GET /api/user/auth/google/callback
   */
  static googleAuthSuccess = asyncHandler(async (req, res) => {
    try {
      // req.user contains the Google user data from Passport strategy
      const googleUserData = req.user;

      if (!googleUserData || !googleUserData.email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(
          `${frontendUrl}/login?error=google_auth_failed&message=${encodeURIComponent('Failed to get user information from Google')}`
        );
      }

      // Create or login user using Google data
      const result = await UserAuthService.googleAuth(googleUserData);

      // Get frontend URL based on environment
      const frontendUrl = process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL_PROD
        : process.env.FRONTEND_URL || 'http://localhost:3000';

      // Redirect to frontend with token and user data
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}&isNewUser=${result.isNewUser}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google auth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=google_auth_failed&message=${encodeURIComponent(error.message || 'Authentication failed')}`
      );
    }
  });
}
