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
        status: 'active',
        email_verified: false,
      })
      .select('id, email, first_name, last_name, phone, created_at')
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

  /**
   * Google OAuth Authentication
   */
  static async googleAuth(googleUserData) {
    const { googleId, email, firstName, lastName, avatarUrl, emailVerified } = googleUserData;

    // Validate required fields
    if (!googleId || !email) {
      throw new AppError('Invalid Google user data', 400);
    }

    // Check if user exists by Google ID
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    let isNewUser = false;

    // If not found by Google ID, check by email
    if (!user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        // User exists with email/password - link Google account
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            google_id: googleId,
            oauth_provider: 'google',
            avatar_url: avatarUrl,
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select('*')
          .single();

        if (updateError) throw new AppError(updateError.message, 500);
        user = updatedUser;
      } else {
        // Create new user with Google account
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email,
            google_id: googleId,
            oauth_provider: 'google',
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            status: 'active',
          })
          .select('*')
          .single();

        if (createError) throw new AppError(createError.message, 500);
        user = newUser;
        isNewUser = true;
      }
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Account is inactive. Please contact support.', 403);
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
      isNewUser,
    };
  }
}
