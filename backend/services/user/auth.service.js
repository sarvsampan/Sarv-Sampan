import supabase from '../../config/supabase.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { CartService } from './cart.service.js';

export class UserAuthService {
  /**
   * User Signup
   */
  static async signup(userData) {
    const { email, password, first_name, last_name, phone } = userData;

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new AppError('Email already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone,
        role: 'user',
        status: 'active',
        email_verified: false,
      })
      .select('id, email, first_name, last_name, phone, role, created_at')
      .single();

    if (error) throw new AppError(error.message, 500);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      token,
    };
  }

  /**
   * User Login
   */
  static async login(email, password, sessionId = null) {
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if password exists (database uses password_hash field)
    if (!user.password_hash) {
      throw new AppError('User account not properly set up. Please contact support.', 500);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Account is inactive. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Merge guest cart to user cart if sessionId is provided
    if (sessionId) {
      try {
        await CartService.mergeCart(user.id, sessionId);
      } catch (error) {
        // Don't fail login if cart merge fails
        console.error('Cart merge failed:', error);
      }
    }

    // Update last activity
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Return user data (exclude password_hash)
    const { password_hash: _, ...userData } = user;

    return {
      user: userData,
      token,
    };
  }

  /**
   * Get User Profile
   */
  static async getProfile(userId) {
    const { data: user, error} = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, status, email_verified, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update User Profile
   */
  static async updateProfile(userId, updateData) {
    const { name, phone } = updateData;

    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', userId)
      .select('id, email, name, phone, role')
      .single();

    if (error) throw new AppError(error.message, 500);

    return user;
  }

  /**
   * Change Password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw new AppError(updateError.message, 500);

    return true;
  }
}
