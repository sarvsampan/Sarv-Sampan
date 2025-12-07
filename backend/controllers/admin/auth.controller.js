import { AuthService } from '../../services/admin/auth.service.js';
import { success, error } from '../../utils/response.js';
import { isValidEmail, isStrongPassword } from '../../utils/validation.util.js';

export class AuthController {
  /**
   * POST /api/admin/auth/login
   * Admin Login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json(error('Email and password are required', 400));
      }

      if (!isValidEmail(email)) {
        return res.status(400).json(error('Invalid email format', 400));
      }

      const result = await AuthService.login(email, password);

      res.status(200).json(success(result, 'Login successful'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/auth/profile
   * Get current admin profile
   */
  static async getProfile(req, res, next) {
    try {
      const adminId = req.adminId;
      const profile = await AuthService.getProfile(adminId);

      res.status(200).json(success(profile, 'Profile retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/auth/profile
   * Update admin profile
   */
  static async updateProfile(req, res, next) {
    try {
      const adminId = req.adminId;
      const { name } = req.body;

      const updatedProfile = await AuthService.updateProfile(adminId, { name });

      res.status(200).json(success(updatedProfile, 'Profile updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/auth/change-password
   * Change admin password
   */
  static async changePassword(req, res, next) {
    try {
      const adminId = req.adminId;
      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json(error('Current and new password are required', 400));
      }

      if (!isStrongPassword(newPassword)) {
        return res.status(400).json(error('Password must be at least 8 characters long', 400));
      }

      await AuthService.changePassword(adminId, currentPassword, newPassword);

      res.status(200).json(success(null, 'Password changed successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/auth/create-admin
   * Create new admin (Super Admin only)
   */
  static async createAdmin(req, res, next) {
    try {
      const createdBy = req.adminId;
      const { email, password, name, role } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json(error('Email, password and name are required', 400));
      }

      if (!isValidEmail(email)) {
        return res.status(400).json(error('Invalid email format', 400));
      }

      if (!isStrongPassword(password)) {
        return res.status(400).json(error('Password must be at least 8 characters long', 400));
      }

      const newAdmin = await AuthService.createAdmin({ email, password, name, role }, createdBy);

      res.status(201).json(success(newAdmin, 'Admin created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/auth/logout
   * Admin Logout (client-side token removal)
   */
  static async logout(req, res, next) {
    try {
      // In JWT, logout is handled client-side by removing the token
      // But we can log the logout activity here if needed
      res.status(200).json(success(null, 'Logged out successfully'));
    } catch (err) {
      next(err);
    }
  }
}
