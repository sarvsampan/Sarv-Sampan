import { UserAuthService } from '../../services/user/auth.service.js';
import { asyncHandler } from '../../middlewares/async.middleware.js';

export class UserAuthController {
  /**
   * User Signup
   */
  static signup = asyncHandler(async (req, res) => {
    const { email, password, name, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const result = await UserAuthService.signup({ email, password, name, phone });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result
    });
  });

  /**
   * User Login
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await UserAuthService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  /**
   * Get User Profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const user = await UserAuthService.getProfile(userId);

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Update User Profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    const user = await UserAuthService.updateProfile(userId, { name, phone });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  /**
   * Change Password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    await UserAuthService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });
}
