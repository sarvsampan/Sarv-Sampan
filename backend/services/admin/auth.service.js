import supabase from '../../config/supabase.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { AppError } from '../../middlewares/error.middleware.js';

export class AuthService {
  /**
   * Admin Login
   */
  static async login(email, password) {
    console.log('🔐 Admin login attempt:', email);

    // Find admin by email
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('📊 Supabase query result:', { admin: admin ? 'Found' : 'Not found', error });

    if (error || !admin) {
      console.log('❌ Login failed: Invalid credentials');
      throw new AppError('Invalid email or password', 401);
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      console.log('❌ Login failed: Account inactive');
      throw new AppError('Admin account is inactive', 403);
    }

    // Verify password
    console.log('🔑 Verifying password...');
    const isPasswordValid = await comparePassword(password, admin.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password');
      throw new AppError('Invalid email or password', 401);
    }

    console.log('✅ Login successful for:', email);

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate JWT token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role
    });

    // Return admin data (exclude password)
    const { password_hash, ...adminData } = admin;

    return {
      admin: adminData,
      token
    };
  }

  /**
   * Get Admin Profile
   */
  static async getProfile(adminId) {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, status, last_login, created_at')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      throw new AppError('Admin not found', 404);
    }

    return admin;
  }

  /**
   * Update Admin Profile
   */
  static async updateProfile(adminId, updateData) {
    const { name } = updateData;

    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateFields.name = name;

    const { data: admin, error } = await supabase
      .from('admin_users')
      .update(updateFields)
      .eq('id', adminId)
      .select('id, email, name, role, status')
      .single();

    if (error) throw new AppError(error.message, 500);

    return admin;
  }

  /**
   * Change Password
   */
  static async changePassword(adminId, currentPassword, newPassword) {
    // Get admin with password
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      throw new AppError('Admin not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, admin.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (updateError) throw new AppError(updateError.message, 500);

    return true;
  }

  /**
   * Create Admin User (Only for Super Admin)
   */
  static async createAdmin(adminData, createdBy) {
    const { email, password, name, role = 'admin' } = adminData;

    // Check if email already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new AppError('Email already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        password_hash: hashedPassword,
        name,
        role,
        status: 'active',
        created_by: createdBy,
      })
      .select('id, email, name, role, status, created_at')
      .single();

    if (error) throw new AppError(error.message, 500);

    return newAdmin;
  }
}
